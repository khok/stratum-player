import { ClassPrototype } from "/common/classPrototype";
import { createComposedScheme } from "/common/createComposedScheme";
import { ProjectInfo } from "/common/fileFormats/prj";
import { readSttFile, VariableSet } from "/common/fileFormats/stt";
import { readVdrFile } from "/common/fileFormats/vdr";
import { VectorDrawing } from "/common/fileFormats/vdr/types/vectorDrawing";
import { VirtualFileSystem } from "/common/virtualFileSystem";
import { BinaryStream } from "/helpers/binaryStream";
import { resolvePath2 } from "/helpers/pathOperations";
import { ProjectManager } from "/vm/interfaces/projectManager";
import { NumBool } from "/vm/types";
import { readClasses, ReadClassesOpts, readPreloadStt, readProjectInfo } from "./projectHelpers";

export interface ProjectOptions<TVmCode> extends ReadClassesOpts<TVmCode> {
    prjFileName?: string;
}

interface ConstructorArgs<TVmCode> {
    fs: VirtualFileSystem;
    classes: Map<string, ClassPrototype<TVmCode>>;
    preloadStt?: VariableSet;
    prjInfo: ProjectInfo;
}

/**
 * Надстройка над файловой системой.
 *
 * Осуществляет файловые операции с относительными путями, управляет содержимым проекта.
 */
export class Project<TVmCode> implements ProjectManager {
    private fs: VirtualFileSystem;

    private baseDirParts: string[];
    private prjInfo: ProjectInfo;

    readonly classes: Map<string, ClassPrototype<TVmCode>>;
    readonly preloadStt?: VariableSet;

    static async open<TVmCode>(fs: VirtualFileSystem, opts: ProjectOptions<TVmCode> = {}) {
        const prjInfo = await readProjectInfo(fs, opts.prjFileName);
        const [classes, preloadStt] = await Promise.all([readClasses(fs, prjInfo, opts), readPreloadStt(fs, prjInfo.baseDirectory)]);
        return new Project({ fs, classes, preloadStt, prjInfo });
    }

    private constructor({ fs, classes, preloadStt, prjInfo }: ConstructorArgs<TVmCode>) {
        this.fs = fs;
        this.classes = classes;
        this.preloadStt = preloadStt;
        this.prjInfo = prjInfo;
        this.baseDirParts = prjInfo.baseDirectory.split("\\");
    }

    get baseDirectory(): string {
        return this.prjInfo.baseDirectory;
    }

    get rootClassName() {
        return this.prjInfo.rootClassName;
    }

    getClassScheme(className: string): VectorDrawing | undefined {
        const data = this.classes.get(className.toLowerCase());
        if (!data || !data.scheme) return undefined;
        //TODO: закешировать скомпозированную схему.
        const { children, scheme } = data;
        return children ? createComposedScheme(scheme, children, this.classes) : scheme;
    }

    hasClass(className: string): NumBool {
        return this.classes.has(className.toLowerCase()) ? 1 : 0;
    }

    getClassDirectory(className: string): string {
        const cl = this.classes.get(className.toLowerCase());
        return cl ? cl.directory : "";
    }

    openFileStream(path: string): BinaryStream | undefined {
        const filename = resolvePath2(path, this.baseDirParts);
        if (filename === undefined) return undefined;
        const file = this.fs.getFile(filename);
        return file && file.openStreamSync();
    }

    openVdrFile(path: string): VectorDrawing | undefined {
        const stream = this.openFileStream(path);
        return stream && readVdrFile(stream, { origin: "file", name: stream.filename });
    }

    openSttFile(path: string): VariableSet | undefined {
        const stream = this.openFileStream(path);
        return stream && readSttFile(stream);
    }

    isFileExist(path: string): NumBool {
        const filename = resolvePath2(path, this.baseDirParts);
        return filename && this.fs.getFile(filename) ? 1 : 0;
    }
}
