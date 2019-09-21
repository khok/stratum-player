import { JSZipObject, loadAsync } from "jszip";
import { StratumError } from "../errors";
import { ClassData, ClassHeaderData } from "../types";
import { BinaryStream } from "./binaryStream";
import { readClassData, readClassHeaderData } from "./deserialization/classFile";
import { readProjectName } from "./deserialization/projectFile";
import { readVarSet } from "./deserialization/varsFile";

type ZipData = JSZipObject[];

type ExtendedHeader = ClassHeaderData & { stream: BinaryStream };

//Ищет все файлы с указанным именем
function findFiles(files: ZipData, ending: string) {
    return files.filter(({ name }) => name.toLowerCase().endsWith(ending.toLowerCase()));
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

    const classesData = (await unzipFilesWithExt(files, "cls")).map(bytes => {
        const stream = new BinaryStream(bytes);
        const data = <ExtendedHeader>readClassHeaderData(stream);
        data.stream = stream;
        return data;
    });

    const res = new Map<string, ExtendedHeader>();
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
    headers: Map<string, ExtendedHeader>,
    className: string,
    classes: Map<string, ClassData>
) {
    const root = headers.get(className);
    if (!root) throw new StratumError(`Класс ${className} не найден`);

    //prettier-ignore
    const rootBody = classes.get(root.name) || (() => {
        const body = readClassData(root.stream, root.version, {
            parseBytecode: true,
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
export async function readClassFiles(files: ZipData, mainClassName: string) {
    const headers = await loadHeaders(files);
    const res = new Map<string, ClassData>();
    loadProjectClasses(headers, mainClassName, res);
    return res;
}

export async function readAllClassFiles(files: ZipData, silent = false) {
    const headers = await loadHeaders(files);
    const res = new Map<string, ClassData>();
    for (const [name, { stream, version }] of headers.entries()) {
        try {
            const data = readClassData(stream, version, { readImage: true, readScheme: true, parseBytecode: true });
            res.set(name, data);
        } catch (e) {
            if (!silent) {
                console.log(`Ошибка чтения ${name}`);
                console.error(e);
            }
        }
    }
    return res;
}

//Ищет файл проекта и читает его данные
export async function readProjectFile(files: ZipData, projectFileName: string = "project.spj") {
    const prjBytes = await unzipFile(findSingleFile(files, projectFileName));
    return readProjectName(new BinaryStream(prjBytes));
}

export async function readVarsFile(
    files: ZipData,
    collection: Map<string, ClassData>,
    preloadFile: string = "_preload.stt"
) {
    const file = findSingleFile(files, preloadFile, false);
    if (!file) return undefined;
    const preloadBytes = await unzipFile(file);
    return readVarSet(new BinaryStream(preloadBytes), collection);
}

//Возвращает содержимое ZIP указанного файла
async function loadZipData(file: Blob | File) {
    const { files } = await loadAsync(file);
    return Object.keys(files).map(key => files[key]);
}

async function loadFromUrl(url: string) {
    const resp = await fetch(url);
    const file = await resp.blob();
    return loadZipData(file);
}

export async function zipFromFileList(files: FileList): Promise<ZipData> {
    const zipData = await Promise.all(Array.from({ length: files.length }, (_, i) => loadZipData(files[i])));

    return new Array<JSZipObject>().concat(...zipData);
}

export async function openStreamFromUrl(url: string) {
    const resp = await fetch(url);
    const file = await resp.arrayBuffer();
    return new BinaryStream(file);
}

export async function zipFromUrl(url: string | string[]): Promise<ZipData> {
    if (typeof url === "string") url = [url];

    const zipData = await Promise.all(url.map(loadFromUrl));
    return new Array<JSZipObject>().concat(...zipData);
}
