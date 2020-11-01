import { Project, ProjectDiag, WindowSystem } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { readVdrFile, VectorDrawing } from "stratum/fileFormats/vdr";
import { GraphicsManager } from "stratum/graphics/manager/graphicsManager";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { Mutable } from "stratum/helpers/utilityTypes";
import { build } from "stratum/schema/build";
import { TreeManager } from "stratum/schema/treeManager";
import { VirtualDir, VirtualFileSystem } from "stratum/vfs";
import { ExecutionContext } from "stratum/vm/executionContext";
import { ProjectManager } from "stratum/vm/interfaces/projectManager";
import { findMissingCommandsRecursive, formatMissingCommands } from "stratum/vm/showMissingCommands";
import { NumBool, ParsedCode } from "stratum/vm/types";
import { SimpleComputer } from "./simpleComputer";

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
    private _state: "closed" | "playing" | "paused" = "closed";
    private loop: (() => void) | undefined;
    private handlers = {
        closed: new Set<any>(),
        error: new Set<any>(),
    };
    private prevWs?: WindowSystem;

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

    play(ws?: WindowSystem): this {
        if (this.loop) return this;
        this.prevWs = ws || this.prevWs;
        // TODO: по идее то что здесь создается надо подкешировать
        const { classes, prjInfo: prj, stt } = this;
        const tree = build(prj.rootClassName, classes);
        const memoryManager = tree.createMemoryManager();

        if (stt) tree.applyVarSet(stt);

        const ctx = new ExecutionContext({
            classManager: new TreeManager({ tree }),
            memoryManager,
            projectManager: this,
            windows: new GraphicsManager(this.prevWs!), // FIXME:
        });

        this._diag.iterations = 0;

        // Main Loop
        this.loop = () => {
            ++this._diag.iterations;
            tree.compute(ctx);
            if (ctx.executionStopped) {
                this.close(!ctx.hasError);
                if (ctx.hasError) this.handlers.error.forEach((h) => h(ctx.error));
                else this.handlers.closed.forEach((h) => h());
            }
            memoryManager.sync().assertZeroIndexEmpty();
        };

        memoryManager.init();
        this.computer.run(this.loop);
        this._state = "playing";
        return this;
    }
    close(closeWs: boolean = true): this {
        this.computer.stop();
        this.loop = undefined;
        if (closeWs && this.prevWs) this.prevWs.closeAll(); //FIXME ??? А нужно ли закрывать?
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
