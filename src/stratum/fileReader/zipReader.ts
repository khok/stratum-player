import { ClassData, ClassHeaderData } from "data-types-base";
import { JSZipObject, loadAsync } from "jszip";
import { StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { readClassData, readClassHeaderData, readProjectName, readVarSetData } from "./deserialization";

type ExtendedHeader = ClassHeaderData & { _stream: BinaryStream };

function findFiles(files: JSZipObject[], ending: string) {
    return files.filter(({ name }) => name.toLowerCase().endsWith(ending.toLowerCase()));
}

function findSingleFile(zipFiles: JSZipObject[], ending: string, mustExist = true): JSZipObject {
    const files = findFiles(zipFiles, ending);

    if (mustExist && files.length === 0) throw new StratumError(`Файл "${ending}" не найден`);
    if (files.length > 1) {
        const fileString = files.map((f) => f.name).join(";\n");
        throw new StratumError(`Найдено несколько файлов с именем: "${ending}":\n${fileString}`);
    }

    return files[0];
}

function unzipFile(file: JSZipObject) {
    return file.async("uint8array");
}

function unzipFilesWithExt(files: JSZipObject[], ext: string) {
    if (!ext.startsWith(".")) ext = "." + ext;
    const extFiles = findFiles(files, ext);
    return Promise.all(extFiles.map(unzipFile));
}

//Ищет все CLS-файлы и читает их заголовки, искл. blacklist
const clsBlacklist = ["COLORREF", "HANDLE", "POINTER"];
async function loadHeaders(files: JSZipObject[]) {
    const res = new Map<string, ExtendedHeader>();
    (await unzipFilesWithExt(files, "cls")).forEach((bytes) => {
        const stream = new BinaryStream(bytes);
        const data = <ExtendedHeader>readClassHeaderData(stream);
        const { name } = data;
        if (res.has(name)) throw new StratumError(`Конфликт имен имиджей: ${name}`);
        if (clsBlacklist.includes(name)) return;
        data._stream = stream;
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
function loadProjectClasses(headers: Map<string, ExtendedHeader>, className: string, classes: Map<string, ClassData>) {
    const root = headers.get(className);
    if (!root) throw new StratumError(`Класс ${className} не найден`);

    //prettier-ignore
    const { childs } : ClassData = classes.get(root.name) || (() => {
        const body = readClassData(root._stream, root.version, {
            readImage: true,
            readScheme: true,
            parseBytecode: true,
        });
        classes.set(root.name, body);
        return body;
    })();
    if (childs) childs.forEach((child) => loadProjectClasses(headers, child.classname, classes));
}

/**
 * Ищет указанный корневой класс в архиве и рекурсивно подгружает все необходимые дочерние классы
 * @param files данные ZIP-архива с файлами классов
 * @param mainClassName имя корневого класса
 */
export async function readClassFiles(files: JSZipObject[], mainClassName: string) {
    const headers = await loadHeaders(files);
    const res = new Map<string, ClassData>();
    loadProjectClasses(headers, mainClassName, res);
    return res;
}

/**
 * Считывает данные всех классов проекта.
 * @param files данные ZIP-архива с файлами классов
 * @param silent не выбрасывать ошибки при чтении
 */
export async function readAllClassFiles(files: JSZipObject[], silent = false) {
    const headers = await loadHeaders(files);
    const res = new Map<string, ClassData>();
    for (const [name, { _stream: stream, version }] of headers) {
        try {
            const data = readClassData(stream, version, { readImage: true, readScheme: true, parseBytecode: true });
            res.set(name, data);
        } catch (e) {
            if (!silent) {
                console.error(`Ошибка чтения ${name}\n`, e);
                // console.error(e);
            }
        }
    }
    return res;
}

export async function readProjectFile(files: JSZipObject[], filename: string = "project.spj") {
    const prjBytes = await unzipFile(findSingleFile(files, filename));
    return readProjectName(new BinaryStream(prjBytes));
}

export async function readVarsFile(files: JSZipObject[], filename: string = "_preload.stt") {
    const file = findSingleFile(files, filename, false);
    if (!file) return undefined;
    const preloadBytes = await unzipFile(file);
    return readVarSetData(new BinaryStream(preloadBytes));
}

export async function readImageFiles(files: JSZipObject[]) {
    const extFiles = findFiles(files, ".bmp");
    const names = extFiles.map((f) => f.name);
    const datas = await Promise.all(extFiles.map((f) => f.async("base64")));
    return Array.from({ length: extFiles.length }, (_, i) => ({ filename: names[i], data: datas[i] }));
}

/**
 * Получает содержимое архива из файла или Blob.
 * @remarks
 * не используйте его напрямую - используйте `openZipFromFileList` вместо этого метода
 */
export async function zipFromBlob(file: Blob | File) {
    const { files } = await loadAsync(file);
    return Object.keys(files).map((key) => files[key]);
}

/**
 * Получает содержимое архива с `url`.
 * @remarks
 * не используйте его напрямую - используйте `openZipFromUrl` вместо этого метода
 */
export async function zipFromUrl(url: string) {
    try {
        const resp = await fetch(url);
        const file = await resp.blob();
        const zip = await zipFromBlob(file);
        return zip;
    } catch (e) {
        throw new StratumError(`Невозможно открыть файл ${url}:\n${e}`);
    }
}
