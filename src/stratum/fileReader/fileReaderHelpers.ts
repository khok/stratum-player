import { ClassData, VarSetData } from "cls-types";
import { JSZipObject } from "jszip";
import { ProjectFile } from "other-types";
import { BinaryStream } from "~/helpers/binaryStream";
import {
    cutFilename,
    readClassFiles,
    readProjectFile,
    readProjectFiles,
    readVarsFile,
    zipFromBlob,
    zipFromUrl,
    ZipFiles,
} from "./zipReader";

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

export interface ReadOptions {
    projectFile?: string;
    sttFile?: string;
    customRootClass?: string;
    baseDir?: string;
}

export interface ProjectContent {
    rootName: string;
    classesData: Map<string, ClassData>;
    varSet?: VarSetData;
    projectFiles: ProjectFile[];
    filenames: string[];
}

//TODO: отличать директории основного проекта и библиотек,
// поскольку rootDepth урезает пути библиотек.
export async function readProjectData(files: JSZipObject[], options?: ReadOptions): Promise<ProjectContent> {
    if (!options) options = {};
    const prjFileName = options.projectFile || "project.spj";

    const zipFiles: ZipFiles = options.customRootClass
        ? {
              files,
              baseDir: options.baseDir || "",
              rootClassName: options.customRootClass,
              baseDirDepth: options.baseDir ? options.baseDir.split("/").length : 0,
          }
        : await readProjectFile(files, prjFileName);

    const sttFileName = zipFiles.baseDir + (options.sttFile || "_preload.stt");

    const [classesData, varSet, projectFiles] = await Promise.all([
        readClassFiles(zipFiles),
        readVarsFile(files, sttFileName),
        readProjectFiles(zipFiles),
    ]);
    const rootName = zipFiles.rootClassName;
    const filenames = files.map((f) => cutFilename(f.name, zipFiles.baseDirDepth));

    return { rootName, classesData: classesData!, varSet, projectFiles: projectFiles!, filenames };
}
