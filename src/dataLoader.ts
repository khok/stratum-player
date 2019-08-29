import { JSZipObject, loadAsync } from "jszip";
import {
    BinaryStream,
    readStratumClassBody,
    readStratumClassHeader,
    readStratumProject,
    readStratumVars,
    StratumClassHeaderInfo,
    StratumClassInfo
} from "./deserializers";
import { StratumError } from "./errors";

type ZipData = JSZipObject[];

//Ищет все файлы с указанным именем
function findFiles(files: ZipData, _name: string) {
    return files.filter(({ name }) => name.toLowerCase().endsWith(_name.toLowerCase()));
}

function findSingleFile(zipFiles: ZipData, fileName: string, mustExist = true): JSZipObject {
    const files = findFiles(zipFiles, fileName);

    if (mustExist && files.length === 0) throw new StratumError(`Файл "${fileName}" не найден`);
    if (files.length > 1) throw new StratumError(`Найдено несколько файлов с именем: "${fileName}"`);

    return files[0];
}

//Распаковывает файл
function unzipFile(file: JSZipObject) {
    return file.async("uint8array");
}

//Распаковывает все файлы с именем, заканчивающимся на ext
function unzipFilesWithExt(files: ZipData, ext: string) {
    if (!ext.startsWith(".")) ext = "." + ext;
    const extFiles = findFiles(files, ext);
    return Promise.all(extFiles.map(unzipFile));
}

//Ищет все CLS-файлы и читает их заголовки, искл. blacklist
async function loadHeaders(files: ZipData) {
    const blacklist = ["COLORREF", "HANDLE", "POINTER"];

    const classesData = (await unzipFilesWithExt(files, "cls")).map(bytes =>
        readStratumClassHeader(new BinaryStream(bytes))
    );

    const res = new Map<string, StratumClassHeaderInfo>();
    classesData.forEach(data => {
        const { name } = data;
        if (blacklist.includes(name)) return;
        if (res.has(name)) throw new StratumError(`Конфликт имен имиджей: ${name}`);
        res.set(name, data);
    });
    return res;
}

/**
 * Рекурсивно формирует библиотеку прототипов классов, встречающихся в проекте
 * @param headers массив заголовков
 * @param className название текущего класса
 * @param classes библиотека классов
 */
async function loadProjectClasses(
    headers: Map<string, StratumClassHeaderInfo>,
    className: string,
    classes: Map<string, StratumClassInfo>
) {
    const root = headers.get(className);
    if (!root) throw new Error(`Класс ${className} не найден`);

    //prettier-ignore
    const rootBody = classes.get(root.name) || (() => {
        const body = readStratumClassBody(root.stream, root.version, {
            convertVmCode: true,
            readImage: true,
            readScheme: true
        });
        classes.set(root.name, body);
        return body;
    })();
    const { childs } = rootBody;
    if (childs) childs.forEach(child => loadProjectClasses(headers, child.className, classes));
}

/**
 * Ищет указанный корневой класс в архиве и рекурсивно подгружает все необходимые дочерние классы
 * @param files данные ZIP-архива с файлами классов
 * @param mainClassName имя корневого класса
 */
async function readClassFiles(files: ZipData, mainClassName: string) {
    const headers = await loadHeaders(files);
    const res = new Map<string, StratumClassInfo>();
    loadProjectClasses(headers, mainClassName, res);
    return res;
}

async function readAllClassFiles(files: ZipData) {
    const headers = await loadHeaders(files);
    const res = new Map<string, StratumClassInfo>();
    const iterator = headers.entries();
    for (let iter = iterator.next(); !iter.done; iter = iterator.next()) {
        const [name, { stream, version }] = iter.value;
        res.set(name, readStratumClassBody(stream, version, { readImage: true, readScheme: true }));
    }
    return res;
}

//Ищет файл проекта и читает его данные
async function readProjectFile(files: ZipData, projectFileName: string = "project.spj") {
    const prjBytes = await unzipFile(findSingleFile(files, projectFileName));
    return readStratumProject(new BinaryStream(prjBytes));
}

async function readVarsFile(
    files: ZipData,
    collection: Map<string, StratumClassInfo>,
    preloadFile: string = "_preload.stt"
) {
    const file = findSingleFile(files, preloadFile, false);
    if (!file) return undefined;
    const preloadBytes = await unzipFile(file);
    return readStratumVars(new BinaryStream(preloadBytes), collection);
}

//Возвращает содержимое ZIP указанного файла
async function loadZipData(file: Blob | File) {
    const { files } = await loadAsync(file);
    return Object.values(files);
}

async function loadFromUrl(url: string) {
    const resp = await fetch(url);
    const file = await resp.blob();
    return loadZipData(file);
}

async function zipFromFileList(files: FileList): Promise<ZipData> {
    const zipData = await Promise.all(Array.from({ length: files.length }, (_, i) => loadZipData(files[i])));

    return new Array<JSZipObject>().concat(...zipData);
}

async function zipFromUrl(url: string | string[]): Promise<ZipData> {
    if (typeof url === "string") url = [url];

    const zipData = await Promise.all(url.map(loadFromUrl));
    return new Array<JSZipObject>().concat(...zipData);
}

export { ZipData, zipFromUrl, zipFromFileList, readProjectFile, readClassFiles, readAllClassFiles, readVarsFile };
