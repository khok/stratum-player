import { Project, ProjectDiag, ProjectOptions } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { SimpleWindowManager } from "stratum/graphics/simpleWindowManager";
import { SimpleWs } from "stratum/graphics/simpleWs";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { Mutable } from "stratum/helpers/utilityTypes";
import { build } from "stratum/schema/build";
import { TreeManager } from "stratum/schema/treeManager";
import { VFSDir } from "stratum/vfs";
import { ExecutionContext } from "stratum/vm/executionContext";
import { ProjectManager } from "stratum/vm/interfaces/projectManager";
import { findMissingCommandsRecursive, formatMissingCommands } from "stratum/vm/showMissingCommands";
import { NumBool, ParsedCode } from "stratum/vm/types";
import { SimpleComputer } from "../common/simpleComputer";

export interface ProjectResources {
    dir: VFSDir;
    prjInfo: ProjectInfo;
    classes: ClassProto<ParsedCode>[];
    stt?: VariableSet;
    options?: ProjectOptions;
}

export class Player implements Project, ProjectManager {
    private _diag: Mutable<ProjectDiag>;
    private _computer = new SimpleComputer();
    private _state: "closed" | "playing" | "paused" | "error" = "closed";
    private loop: (() => boolean) | undefined;
    private handlers = {
        closed: new Set<any>(),
        error: new Set<any>(),
    };
    private classlib: Map<string, ClassProto<ParsedCode>>;
    private ws?: SimpleWindowManager;

    readonly options: ProjectOptions;
    readonly dir: VFSDir;
    readonly prjInfo: ProjectInfo;
    readonly stt?: VariableSet | undefined;

    constructor({ dir, prjInfo, classes, stt, options }: ProjectResources) {
        this.dir = dir;
        this.prjInfo = prjInfo;
        this.stt = stt;
        this.options = { ...options };

        const classlib = new Map<string, ClassProto<ParsedCode>>();
        for (const p of classes) {
            const keyUC = p.name.toUpperCase();
            const prev = classlib.size;
            classlib.set(keyUC, p);
            if (classlib.size === prev) {
                const files = classes.filter((c) => c.name.toUpperCase() === keyUC).map((c) => c.filepathDos);
                throw Error(`Конфликт имен имиджей: "${p.name}" обнаружен в файлах:\n${files.join(";\n")}.`);
            }
        }
        this.classlib = classlib;

        const miss = findMissingCommandsRecursive(prjInfo.rootClassName, classlib);
        if (miss.errors.length > 0) console.warn("Ошибки:", miss.errors);
        if (miss.missingOperations.length > 0) console.warn(formatMissingCommands(miss.missingOperations));
        this._diag = {
            iterations: 0,
            missingCommands: miss.missingOperations,
        };
    }

    get state() {
        return this._state;
    }

    get computer() {
        return this._computer;
    }

    get diag() {
        return this._diag;
    }

    set computer(value) {
        if (value === this._computer) return;
        if (this._computer.running) {
            this._computer.stop();
            if (this.loop) value.run(this.loop);
        }
        this._computer = value;
    }

    play(container?: HTMLElement): this {
        if (this.loop) return this;

        const host = container && new SimpleWs(container);
        if (host) this.ws = new SimpleWindowManager(host, this.options);
        else this.ws = this.ws || new SimpleWindowManager(undefined, this.options);

        // TODO: по идее то что здесь создается надо подкешировать
        const { classlib, prjInfo: prj, stt } = this;
        const tree = build(prj.rootClassName, classlib);
        const memoryManager = tree.createMemoryManager();
        if (stt) tree.applyVarSet(stt);

        const ctx = new ExecutionContext({
            classManager: new TreeManager({ tree }),
            memoryManager,
            projectManager: this,
            windows: this.ws,
        });

        this._diag.iterations = 0;

        // Main Loop
        this.loop = () => {
            ++this._diag.iterations;
            tree.compute(ctx);
            if (ctx.executionStopped) {
                if (ctx.hasError) {
                    this._state = "error";
                    this.handlers.error.forEach((h) => h(ctx.error));
                } else {
                    this._state = "closed";
                    this.loop = undefined;
                    if (this.ws) this.ws.closeAll();
                    this.handlers.closed.forEach((h) => h());
                }
                return false;
            }
            memoryManager.sync().assertZeroIndexEmpty();
            return true;
        };

        memoryManager.init();
        this.computer.run(this.loop);
        this._state = "playing";
        return this;
    }

    close(): this {
        this.computer.stop();
        this.loop = undefined;
        if (this.ws) this.ws.closeAll();
        this._state = "closed";
        return this;
    }
    pause(): this {
        if (this.computer.running) {
            this.computer.stop();
            this._state = "paused";
        }
        return this;
    }
    continue(): this {
        if (!this.computer.running && this.loop) {
            this.computer.run(this.loop);
            this._state = "playing";
        }
        return this;
    }
    step(): this {
        if (!this.computer.running && this.loop) {
            this.loop();
        }
        return this;
    }

    on(event: "closed" | "error", handler: any): this {
        this.handlers[event].add(handler);
        return this;
    }
    off(event: "closed" | "error", handler?: any): this {
        if (handler) this.handlers[event].delete(handler);
        else this.handlers[event].clear();
        return this;
    }

    get rootClassName() {
        return this.prjInfo.rootClassName;
    }

    getClassScheme(className: string): VectorDrawing | undefined {
        const data = this.classlib.get(className.toUpperCase());
        if (!data || !data.scheme) return undefined;
        //TODO: закешировать скомпозированную схему.
        const { children, scheme } = data;
        return children ? createComposedScheme(scheme, children, this.classlib) : scheme;
    }

    hasClass(className: string): NumBool {
        return this.classlib.has(className.toUpperCase()) ? 1 : 0;
    }

    getClassDirectory(className: string): string {
        const cl = this.classlib.get(className.toUpperCase());
        return (cl && cl.directoryDos) || "";
    }

    private _fileWarnShowed = false;
    openFileStream(path: string): BinaryStream | undefined {
        const f = this.dir.get(path);
        if (!f || f.dir) return undefined;
        const buf = f.arraybufferSync();
        if (!buf) {
            if (!this._fileWarnShowed) throw Error(`Не удалось прочесть содержимое ${f.pathDos}. Возможно, файл не был предзагружен.`);
            this._fileWarnShowed = true;
            return undefined;
        }
        return new BinaryStream(buf, { filepathDos: f.pathDos });
    }

    private _vdrWarnShowed = false;
    openVdrFile(path: string): VectorDrawing | undefined {
        const f = this.dir.get(path);
        if (!f || f.dir) return undefined;
        const vdr = f.readSyncAs("vdr");
        if (!vdr) {
            if (!this._vdrWarnShowed) throw Error(`Не удалось прочесть ${f.pathDos}. Возможно, файл не является VDR-файлом или не был предзагружен.`);
            this._vdrWarnShowed = true;
        }
        return vdr;
    }

    isFileExist(path: string): NumBool {
        return this.dir.get(path) ? 1 : 0;
    }
}
