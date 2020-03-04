import { JSZipObject } from "jszip";
import { BinaryStream } from "~/helpers/binaryStream";
import { zipFromUrl, readClassFiles, readProjectFile, readVarsFile, zipFromBlob, readImageFiles } from "./zipReader";

export async function openZipFromUrl(url: string | string[]): Promise<JSZipObject[]> {
    if (typeof url === "string") url = [url];
    const zipData = await Promise.all(url.map(zipFromUrl));
    return new Array<JSZipObject>().concat(...zipData);
}

export async function openZipFromFileList(files: FileList): Promise<JSZipObject[]> {
    const zipData = await Promise.all(Array.from({ length: files.length }, (_, i) => zipFromBlob(files[i])));
    return new Array<JSZipObject>().concat(...zipData);
}

export async function openStreamFromUrl(url: string) {
    const resp = await fetch(url);
    const file = await resp.arrayBuffer();
    return new BinaryStream(file);
}

export type ReadOptions = {
    projectFile?: string;
    sttFile?: string;
    customRoot?: string;
};

export async function loadProjectData(data: JSZipObject[], options?: ReadOptions) {
    const customRoot = options && options.customRoot;
    const ignorePrj = options && options.projectFile === "";
    const ignoreStt = options && options.sttFile === "";

    if (!customRoot && ignorePrj) throw new Error("Главный класс не выбран");
    const rootName = customRoot || (await readProjectFile(data, options && options.projectFile));
    const collection = await readClassFiles(data, rootName);
    const varSet = ignoreStt ? undefined : await readVarsFile(data, options && options.sttFile);
    const images = await readImageFiles(data);
    return { rootName, collection, varSet, images };
}
