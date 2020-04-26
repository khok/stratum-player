import { ClassData } from "cls-types";
import { JSZipObject, loadAsync } from "jszip";
import { StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { readClassBodyData, readClassHeaderData, readProjectName, readVarSetData } from "./deserialization";

type ExtendedHeader = ClassData & { _stream: BinaryStream };

export interface ZipFiles {
    rootClassName: string;
    baseDir: string;
    baseDirDepth: number;
    files: JSZipObject[];
}

export function cutFilename(name: string, rootDepth: number) {
    return name.split("/").slice(rootDepth).join("\\");
}

async function unzip(file: JSZipObject) {
    return file.async("arraybuffer");
}

function filterFiles(files: JSZipObject[], ending: string): JSZipObject[] {
    const lcname = ending.toLowerCase();
    return files.filter(({ name }) => name.toLowerCase().endsWith(lcname));
}

function filterByRegex(files: JSZipObject[], regex: RegExp): JSZipObject[] {
    return files.filter(({ name }) => name.match(regex));
}

function findSingleFile(files: JSZipObject[], ending: string, mustExist = true): JSZipObject {
    const res = filterFiles(files, ending);

    if (mustExist && res.length === 0) throw new StratumError(`Файл "${ending}" не найден`);
    if (res.length > 1) {
        const fileString = res.map((f) => f.name).join(";\n");
        throw new StratumError(`Найдено несколько файлов с именем: "${ending}":\n${fileString}`);
    }

    return res[0];
}

function unzipFiles(files: ZipFiles, ext: RegExp) {
    return Promise.all(
        filterByRegex(files.files, ext).map(async (f) => ({
            data: await unzip(f),
            filename: cutFilename(f.name, files.baseDirDepth),
        }))
    );
}

//Ищет все CLS-файлы и читает их заголовки, искл. blacklist
const clsBlacklist = ["COLORREF", "HANDLE", "POINTER"];

async function loadHeaders(files: ZipFiles) {
    const res = new Map<string, ExtendedHeader>();

    const classesBytes = await unzipFiles(files, /\.cls$/i);

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
export async function readClassFiles(files: ZipFiles) {
    const headers = await loadHeaders(files);
    const res = new Map<string, ClassData>();
    loadProjectClasses(headers, files.rootClassName, res);
    return res;
}

/**
 * Считывает данные всех классов проекта.
 * @param files данные ZIP-архива с файлами классов
 * @param silent не выбрасывать ошибки при чтении
 */
export async function readAllClassFiles(files: ZipFiles, silent = false) {
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

export async function readProjectFile(files: JSZipObject[], filename: string): Promise<ZipFiles> {
    const file = findSingleFile(files, filename);
    if (!file) throw new StratumError(`Файл проекта ${filename} не найден`);
    const parts = file.name.split("/");
    const baseDirDepth = parts.length - 1;
    const baseDir = file.name.substr(0, file.name.lastIndexOf("/") + 1);
    const prjBytes = await unzip(file);
    const rootClassName = readProjectName(new BinaryStream(prjBytes));
    return { rootClassName, baseDirDepth, baseDir, files };
}

export async function readVarsFile(files: JSZipObject[], filename: string) {
    const lcname = filename.toLowerCase();
    const file = files.find((n) => n.name.toLowerCase() === lcname);
    if (!file) return undefined;
    const varSetBytes = await unzip(file);
    return readVarSetData(new BinaryStream(varSetBytes));
}

export async function readProjectFiles(files: ZipFiles) {
    return unzipFiles(files, /\.(bmp|dbm|vdr)$/i);
}

/**
 * Получает содержимое архива из файла или Blob.
 * @remarks
 * не используйте его напрямую - используйте `openZipFromFileList` вместо этого метода
 */
export async function zipFromBlob(file: Blob | File, encoding?: string) {
    const decoder = new TextDecoder(encoding || "cp866");
    const { files } = await loadAsync(file, { decodeFileName: (bytes) => decoder.decode(bytes) });
    return Object.keys(files).map((key) => files[key]);
}

/**
 * Получает содержимое архива с `url`.
 * @remarks
 * не используйте его напрямую - используйте `openZipFromUrl` вместо этого метода
 */
export async function zipFromUrl(url: string, encoding?: string) {
    try {
        const resp = await fetch(url);
        const file = await resp.blob();
        const zip = await zipFromBlob(file, encoding);
        return zip;
    } catch (e) {
        throw new StratumError(`Невозможно открыть файл ${url}:\n${e}`);
    }
}
