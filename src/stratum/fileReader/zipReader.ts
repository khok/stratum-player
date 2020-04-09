import { ClassData } from "data-types-base";
import { JSZipObject, loadAsync } from "jszip";
import { StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { readClassBodyData, readClassHeaderData, readProjectName, readVarSetData } from "./deserialization";

type ExtendedHeader = ClassData & { _stream: BinaryStream };

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

async function unzipFile(file: JSZipObject) {
    const data = await file.async("uint8array");
    return { filename: file.name.replace(/\//g, "\\"), data };
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

    const classesBytes = await unzipFilesWithExt(files, "cls");

    classesBytes.forEach(({ filename, data }) => {
        const stream = new BinaryStream(data);
        const body: ExtendedHeader = { ...readClassHeaderData(stream), _stream: stream, fileName: filename };

        if (res.has(body.name)) throw new StratumError(`Конфликт имен имиджей: ${body.name}`);
        if (clsBlacklist.includes(body.name)) return;
        res.set(body.name, body);
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
    let cl = classes.get(className);
    if (!cl) {
        const header = headers.get(className);
        if (!header) throw new StratumError(`Класс ${className} не найден`);
        readClassBodyData(header._stream, header, {
            readImage: true,
            readScheme: true,
            parseBytecode: true,
        });
        header._stream = undefined!;
        classes.set(header.name, header);
        cl = header;
    }
    if (cl.childInfo) cl.childInfo.forEach((child) => loadProjectClasses(headers, child.classname, classes));
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
    for (const header of headers) {
        const [name, data] = header;
        try {
            readClassBodyData(data._stream, data, { readImage: true, readScheme: true, parseBytecode: true });
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
    return readProjectName(new BinaryStream(prjBytes.data));
}

export async function readVarsFile(files: JSZipObject[], filename: string = "_preload.stt") {
    const file = findSingleFile(files, filename, false);
    if (!file) return undefined;
    const preloadBytes = await unzipFile(file);
    return readVarSetData(new BinaryStream(preloadBytes.data));
}

export async function readImageFiles(files: JSZipObject[]) {
    const extFiles = findFiles(files, ".bmp");
    const data = await Promise.all(extFiles.map((f) => unzipFile(f)));
    return data;
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
