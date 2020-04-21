import { JSZipObject } from "jszip";
import { BinaryStream } from "~/helpers/binaryStream";
import { zipFromUrl, readClassFiles, readProjectFile, readVarsFile, zipFromBlob, readImageFiles } from "./zipReader";

export async function openZipFromUrl(url: string | string[], encoding?: string): Promise<JSZipObject[]> {
    if (typeof url === "string") url = [url];
    const zipData = await Promise.all(url.map((url) => zipFromUrl(url, encoding)));
    return new Array<JSZipObject>().concat(...zipData);
}

export async function openZipFromFileList(files: FileList, encoding?: string): Promise<JSZipObject[]> {
    const zipData = await Promise.all(Array.from({ length: files.length }, (_, i) => zipFromBlob(files[i], encoding)));
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
    customRootClass?: string;
};

export async function readProjectData(data: JSZipObject[], options?: ReadOptions) {
    if (!options) options = {};
    const projectFile = options.projectFile || "project.spj";
    const sttFile = options.sttFile || "_preload.stt";

    const rootName = options.customRootClass || (await readProjectFile(data, projectFile));
    const classesData = await readClassFiles(data, rootName);
    const varSet = await readVarsFile(data, sttFile);
    const images = await readImageFiles(data);
    return { rootName, classesData, varSet, images };
}
