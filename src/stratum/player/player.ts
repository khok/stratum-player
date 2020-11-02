import { Project, ProjectDiag, ProjectPlayOptions } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { readVdrFile, VectorDrawing } from "stratum/fileFormats/vdr";
import { HTMLWindowWrapper } from "stratum/graphics/html";
import { SimpleWindowManager } from "stratum/graphics/simpleWindowManager";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { Mutable } from "stratum/helpers/utilityTypes";
import { build } from "stratum/schema/build";
import { TreeManager } from "stratum/schema/treeManager";
import { VirtualDir, VirtualFileSystem } from "stratum/vfs";
import { ExecutionContext } from "stratum/vm/executionContext";
import { ProjectManager } from "stratum/vm/interfaces/projectManager";
import { findMissingCommandsRecursive, formatMissingCommands } from "stratum/vm/showMissingCommands";
import { NumBool, ParsedCode } from "stratum/vm/types";
import { SimpleComputer } from "../common/simpleComputer";

export interface PlayerResources {
    fs: VirtualFileSystem;
    workDir: VirtualDir;
    prjInfo: ProjectInfo;
    classes: Map<string, ClassProto<ParsedCode>>;
    stt?: VariableSet;
}

export class Player implements Project, ProjectManager, PlayerResources {
    private _diag: Mutable<ProjectDiag>;
    private _computer = new SimpleComputer();
    private _state: "closed" | "playing" | "paused" | "error" = "closed";
    private loop: (() => boolean) | undefined;
    private handlers = {
        closed: new Set<any>(),
        error: new Set<any>(),
    };
    private wnd?: HTMLWindowWrapper;
    private savedElement?: HTMLElement;

    fs: VirtualFileSystem;
    workDir: VirtualDir;
    prjInfo: ProjectInfo;
    classes: Map<string, ClassProto<ParsedCode>>;
    stt?: VariableSet | undefined;

    constructor(res: PlayerResources) {
        this.fs = res.fs;
        this.workDir = res.workDir;
        this.prjInfo = res.prjInfo;
        this.classes = res.classes;
        this.stt = res.stt;
        const miss = findMissingCommandsRecursive(res.prjInfo.rootClassName, res.classes);
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
        if (value == this._computer) return;
        if (this._computer.running) {
            this._computer.stop();
            if (this.loop) value.run(this.loop);
        }
        this._computer = value;
    }

    play(options?: HTMLElement | ProjectPlayOptions): this {
        if (this.loop) return this;
        const mainWindowContainer = options instanceof HTMLElement ? options : options && options.mainWindowContainer;
        if (mainWindowContainer && mainWindowContainer !== this.savedElement) {
            if (this.wnd) this.wnd.close(true); //закрываем под старым рутом
            this.wnd = new HTMLWindowWrapper(mainWindowContainer, "window_1", options instanceof HTMLElement ? undefined : options); //открываем под новым
            this.savedElement = mainWindowContainer;
        }
        // TODO: по идее то что здесь создается надо подкешировать
        const { classes, prjInfo: prj, stt } = this;
        const tree = build(prj.rootClassName, classes);
        const memoryManager = tree.createMemoryManager();

        if (stt) tree.applyVarSet(stt);

        const ctx = new ExecutionContext({
            classManager: new TreeManager({ tree }),
            memoryManager,
            projectManager: this,
            windows: new SimpleWindowManager(this.wnd), // FIXME:
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
                    if (this.wnd) this.wnd.close(false); //FIXME: А нужно ли закрывать окно?
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
        if (this.wnd) this.wnd.close(false);
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
        const data = this.classes.get(className.toUpperCase());
        if (!data || !data.scheme) return undefined;
        //TODO: закешировать скомпозированную схему.
        const { children, scheme } = data;
        return children ? createComposedScheme(scheme, children, this.classes) : scheme;
    }

    hasClass(className: string): NumBool {
        return this.classes.has(className.toUpperCase()) ? 1 : 0;
    }

    getClassDirectory(className: string): string {
        const cl = this.classes.get(className.toUpperCase());
        return (cl && cl.directoryDos) || "";
    }

    openFileStream(path: string): BinaryStream | undefined {
        const f = this.fs.resolveFile(path, this.workDir);
        return f && !f.dir ? f.streamSync() : undefined;
    }

    openVdrFile(path: string): VectorDrawing | undefined {
        const stream = this.openFileStream(path);
        return stream && readVdrFile(stream, { origin: "file", name: stream.meta.filepathDos || "" });
    }

    openSttFile(path: string): VariableSet | undefined {
        const stream = this.openFileStream(path);
        return stream && readSttFile(stream);
    }

    isFileExist(path: string): NumBool {
        return this.fs.resolveFile(path) ? 1 : 0;
    }
}
