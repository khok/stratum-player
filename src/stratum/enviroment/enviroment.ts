import { crefToB, crefToG, crefToR, rgbToCref } from "stratum/common/colorrefParsers";
import { Constant } from "stratum/common/constant";
import { EventSubscriber, NumBool } from "stratum/common/types";
import { VarType } from "stratum/common/varType";
import { installContextFunctions } from "stratum/compiler";
import { readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { Hyperbase, VectorDrawing, WindowStyle } from "stratum/fileFormats/vdr";
import { WindowRect } from "stratum/graphics/old_sceneWindow";
import { GroupElement2D } from "stratum/graphics/scene/elements/groupElement2d";
import { PrimaryElement, Scene, SceneElement } from "stratum/graphics/scene/scene";
import { BrushSVG } from "stratum/graphics/scene/svg/brushSVG";
import { LineSVG } from "stratum/graphics/scene/svg/lineSVG";
import { PenSVG } from "stratum/graphics/scene/svg/penSVG";
import { RendererSVG } from "stratum/graphics/scene/svg/rendererSVG";
import { BrushTool } from "stratum/graphics/scene/tools/brushTool";
import { PenTool } from "stratum/graphics/scene/tools/penTool";
import { SceneWrapper } from "stratum/graphics/sceneWrapper";
import { ToolsAndElementsConstructors } from "stratum/graphics/toolsAndElementsConstructors";
import { createBrushTools, createElementOrder, createElements, createPenTools, parseWindowAttribs, WindowAttribs } from "stratum/graphics/windowAttribs";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { HandleMap } from "stratum/helpers/handleMap";
import { invertMatrix } from "stratum/helpers/invertMatrix";
import { eventCodeToWinDigit } from "stratum/helpers/keyboardEventKeyMap";
import { getDirectory } from "stratum/helpers/pathOperations";
import { Point2D } from "stratum/helpers/types";
import { MutableArrayLike } from "stratum/helpers/utilityTypes";
import { win1251Table } from "stratum/helpers/win1251";
import { options } from "stratum/options";
import { Project } from "stratum/project";
import { EnviromentFunctions } from "stratum/project/enviromentFunctions";
import { ProjectArgs } from "stratum/project/project";
import { AddDirInfo, CursorRequestHandler, ErrorHandler, PathInfo, ShellHandler, WindowHost } from "stratum/stratum";
import { EnvArray, EnvArraySortingAlgo } from "./envArray";
import { EnvStream } from "./envStream";
import { LazyLibrary } from "./lazyLibrary";
import { NeoMatrix } from "./neoMatrix";
import { readFile } from "./readFile";

export interface ProjectResources extends ProjectArgs {
    classes: LazyLibrary<number>;
}

interface LoadArgs<T> {
    lib: LazyLibrary<T>;
    id?: T;
}

export interface EnviromentHandlers {
    closed: Set<Function>;
    error: Set<ErrorHandler>;
    shell: Set<ShellHandler>;
    cursorRequest: CursorRequestHandler | null;
}

export class Enviroment implements EnviromentFunctions {
    private static readonly startupTime = new Date().getTime();
    /**
     * Загружает все ресурсы указанного проекта.
     * @param prjFile - путь к файлу проекта.
     * @param dirInfo - дополнительная информация (пути к системным библиотекам).
     */
    static async loadProject(prjFile: PathInfo, dirInfo?: AddDirInfo[]): Promise<ProjectResources> {
        const addDirs = dirInfo?.filter((d) => !d.type || d.type === "library").map((d) => d.dir);
        const lib = new LazyLibrary<number>();
        return Enviroment.loadProjectResources(prjFile, { lib }, addDirs);
    }
    private static async loadProjectResources(prjFile: PathInfo, args: LoadArgs<number>, addDirs?: PathInfo[]): Promise<ProjectResources> {
        const workDir = prjFile.resolve("..");
        const sttFile = workDir.resolve("_preload.stt");
        let [prjBuf, sttBuf] = await workDir.fs.arraybuffers([prjFile, sttFile]);
        if (!prjBuf) throw Error(`Файл проекта ${prjFile} не найден`);
        options.log(`Открываем проект ${prjFile.toString()}`);

        // Файл проекта.
        const prjInfo = readPrjFile(new BinaryReader(prjBuf, prjFile.toString()));

        const newPreloadFile = prjInfo.settings?.preloadFile;
        if (newPreloadFile) {
            sttBuf = await workDir.fs.arraybuffer(workDir.resolve(newPreloadFile));
        }

        // Файл состояния.
        let stt: VariableSet | null = null;
        if (sttBuf) {
            try {
                stt = readSttFile(new BinaryReader(sttBuf, sttFile.toString()));
            } catch (e) {
                console.warn(e);
            }
        }

        // Пути поиска имиджей, которые через запятую прописаны в настройках проекта.
        const classDirs: PathInfo[] = [workDir];
        const settingsPaths = prjInfo.settings?.classSearchPaths;
        if (settingsPaths) {
            //prettier-ignore
            const pathsSeparated = settingsPaths.split(",").map((s) => s.trim()).filter((s) => s);
            for (const localPath of pathsSeparated) {
                classDirs.push(workDir.resolve(localPath));
            }
        }
        const dirs = addDirs ? classDirs.concat(addDirs) : classDirs;

        // Имиджи.
        const classes = args.lib;
        // await new Promise((res) => setTimeout(res, 2000));
        await classes.add(workDir.fs, dirs, /*!prjInfo.settings?.notRecursive*/ true, args.id);
        return { classes: classes, dir: workDir, prjInfo, stt, filepath: prjFile.toString() };
    }

    private static kbdTarget: Scene | null = null;
    private static captureTarget: Scene | null = null;
    static handleKeyboard(evt: KeyboardEvent) {
        const code = eventCodeToWinDigit.get(evt.code);
        if (typeof code !== "undefined") {
            Enviroment.keyState[code] = evt.type === "keydown" ? 1 : 0;
        }
        Enviroment.kbdTarget?.dispatchKeyboardEvent(evt, code ?? 0);
    }
    private static _mouseX: number = 0;
    private static _mouseY: number = 0;
    static handlePointer(evt: PointerEvent) {
        Enviroment.keyState[1] = evt.buttons & 1 ? 1 : 0;
        Enviroment.keyState[2] = evt.buttons & 2 ? 1 : 0;
        Enviroment.keyState[4] = evt.buttons & 4 ? 1 : 0;
        Enviroment._mouseX = evt.clientX;
        Enviroment._mouseY = evt.clientY;
        Enviroment.captureTarget?.handleEvent(evt);
    }
    static readonly keyState = new Uint8Array(256);

    static mouseCoords(scene: Scene): [number, number] {
        const rect = scene.ctx.canvas.getBoundingClientRect();
        const clickX = (Enviroment._mouseX - rect.left) / scene._scale;
        const clickY = (Enviroment._mouseY - rect.top) / scene._scale;
        return [clickX, clickY];
    }

    private readonly projects: Project[];

    private _shouldQuit: boolean = false;
    private _isWaiting: boolean = false;
    private loading: Promise<void> | null = null;

    private windows = new Map<string, SceneWrapper>();
    private scenes = new Map<number, SceneWrapper>();
    private streams = new Map<number, EnvStream>();
    private matrices = new Map<number, NeoMatrix>();
    private arrays = new Map<number, EnvArray>();
    private targetScene: Scene | null = null;

    private classes: LazyLibrary<number>;

    private lastPrimary: number = 0;

    private constructors: ToolsAndElementsConstructors = {
        line: LineSVG,
        brush: BrushSVG,
        pen: PenSVG,
        scene: RendererSVG,
    };

    constructor(args: ProjectResources, private host: WindowHost, private handlers: EnviromentHandlers) {
        this.projects = [new Project(this, args)];
        this.classes = args.classes;
    }

    private sessionId(): number {
        return this.projects.length;
    }
    private nextSessionId(): number {
        return this.projects.length + 1;
    }

    compute(): Promise<void | true> {
        // Среда остановлена
        if (this._shouldQuit) {
            return this.closeAllRes();
        }

        if (this.loading) return this.loading;

        const prjIdx = this.projects.length - 1;
        let prj = this.projects[prjIdx];

        // Проект не работает и при этом нет ожидающего проекта.
        if (prj.shouldClose() === true /*&& !this.loading*/) {
            options.log(`Закрывается проект ${prj.filepath}`);
            this.classes.clear(this.sessionId());
            this.closeProjectWindows(prj);
            this.projects.pop();
            if (this.projects.length === 0) {
                return this.closeAllRes();
            }
            prj = this.projects[prjIdx - 1];
        }

        return prj.root.compute();
    }

    requestStop(): void {
        this._shouldQuit = true;
    }

    async closeAllRes(): Promise<true> {
        this._shouldQuit = true;
        this.windows.forEach((w) => w.wnd.close && w.wnd.close());
        this.scenes.clear();
        this.windows.clear();
        this.targetScene?.releaseCapture();
        this.targetScene = null;
        const p: Promise<boolean>[] = [];
        for (const v of this.streams.values()) {
            const r = v.close();
            if (r instanceof Promise) p.push(r);
        }
        await Promise.all(p);
        this.streams.clear();
        this.matrices.clear();
        this.arrays.clear();
        let prj: Project | undefined;
        while ((prj = this.projects.pop())) {
            options.log(`Закрывается проект ${prj.filepath}`);
        }
        // FIXME: разобраться с этой проблемой
        if (this.loading) {
            // console.log("here");
            try {
                await this.loading;
            } catch {}
        }
        this.classes.clearAll();
        return true;
    }

    isWaiting(): boolean {
        return this._isWaiting;
    }
    setWaiting(): void {
        this._isWaiting = true;
    }
    resetWaiting(): void {
        this._isWaiting = false;
    }

    getTime(
        arr1: MutableArrayLike<number>,
        hour: number,
        arr2: MutableArrayLike<number>,
        min: number,
        arr3: MutableArrayLike<number>,
        sec: number,
        arr4: MutableArrayLike<number>,
        hund: number
    ): void {
        const time = new Date();
        arr1[hour] = time.getHours();
        arr2[min] = time.getMinutes();
        arr3[sec] = time.getSeconds();
        arr4[hund] = time.getMilliseconds() * 0.1;
    }
    getDate(arr1: MutableArrayLike<number>, year: number, arr2: MutableArrayLike<number>, mon: number, arr3: MutableArrayLike<number>, day: number): void {
        const time = new Date();
        arr1[year] = time.getFullYear();
        arr2[mon] = time.getMonth();
        arr3[day] = time.getDate();
    }
    getActualSize2d(hspace: number, hobject: number, xArr: MutableArrayLike<number>, xId: number, yArr: MutableArrayLike<number>, yId: number): NumBool {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) {
            xArr[xId] = 0;
            yArr[yId] = 0;
            return 0;
        }
        switch (obj.type) {
            case "group":
            case "line":
                xArr[xId] = obj.width();
                yArr[yId] = obj.height();
                return 1;
            // WIP
        }
    }

    getVarInfo(
        classname: string,
        varIdx: number,
        varNameArr: MutableArrayLike<string>,
        varNameId: number,
        varTypeArr: MutableArrayLike<string>,
        varTypeId: number,
        varDefValueArr: MutableArrayLike<string>,
        varDefValueId: number,
        varDescrArr: MutableArrayLike<string>,
        varDescrId: number,
        varFlagsArr?: MutableArrayLike<number>,
        varFlagsId?: number
    ): NumBool {
        if (varIdx < 0) return 0;
        const vars = this.classes.get(classname)?.vars();
        if (!vars) return 0;
        if (varIdx > vars.count() - 1) return 0;
        const data = vars.data(varIdx);

        // FIXME: если переменная не найдена, значения должны обнулиться.
        varNameArr[varNameId] = data.name;
        varTypeArr[varTypeId] = data.typeString;
        varDescrArr[varDescrId] = data.description;
        varDefValueArr[varDefValueId] = data.rawDefaultValue;
        if (typeof varFlagsArr !== "undefined" && typeof varFlagsId !== "undefined") {
            varFlagsArr[varFlagsId] = data.rawFlags;
        }
        return 1;
    }

    getMousePos(wname: string, xArr: MutableArrayLike<number>, xId: number, yArr: MutableArrayLike<number>, yId: number): NumBool {
        const wnd = this.windows.get(wname);
        if (!wnd) {
            xArr[xId] = 0;
            yArr[yId] = 0;
            return 0;
        }
        const [x, y] = Enviroment.mouseCoords(wnd.scene);
        xArr[xId] = x + wnd.scene.offsetX();
        yArr[yId] = y + wnd.scene.offsetY();
        return 1;
    }

    openSchemeWindow(prj: Project, wname: string, className: string, attrib: string): number {
        const w = this.windows.get(wname);
        if (w) return w.handle;

        const vdr = this.classes.get(className)?.scheme();
        return this.openWindow(prj, wname, parseWindowAttribs(attrib), vdr);
    }
    loadSpaceWindow(prj: Project, wname: string, fileName: string, attrib: string): number | Promise<number> {
        const w = this.windows.get(wname);
        if (w) return w.handle;

        const attribs = parseWindowAttribs(attrib);
        if (fileName === "") {
            return this.openWindow(prj, wname, attribs);
        }

        return readFile(prj.dir.resolve(fileName), "vdr")
            .then((vdr) => this.openWindow(prj, wname, attribs, vdr))
            .catch(() => this.openWindow(prj, wname, attribs));
    }
    createWindowEx(
        prj: Project,
        wname: string,
        parentWname: string,
        source: string,
        x: number,
        y: number,
        w: number,
        h: number,
        attrib: string
    ): number | Promise<number> {
        const wrapper = this.windows.get(wname);
        if (wrapper) return wrapper.handle;

        const callback = (vdr?: VectorDrawing | null): number => {
            const parent = this.windows.get(parentWname);
            const attribs = parseWindowAttribs(attrib);
            const rect: WindowRect = { x, y, w, h };
            if (!parent || !attribs.child) {
                return this.openWindow(prj, wname, attribs, vdr, rect);
            }
            return this.openSubwindow(parent, prj, wname, attribs, rect, vdr);
        };

        const vdr = this.classes.get(source)?.scheme();
        if (vdr) return callback(vdr);
        return readFile(prj.dir.resolve(source), "vdr")
            .then((vdr) => callback(vdr))
            .catch(() => callback());
        // const wnd: SceneWindow = p.openEx(wname, vdr);
        // const handle = HandleMap.getFreeHandle(this.scenes);
        // this.hspaceToWname.set(handle, wname);
        // this.wnameToHspace.set(wname, handle);
        // this.scenes.set(handle, wnd.scene);
        // this.windows.set(wname, wnd);
        // return handle;
    }
    createDIB2d(dir: PathInfo, hspace: number, fileName: string): number | Promise<number> {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        return readFile(dir.resolve(fileName), "bmp")
            .then((img) => scene.createDIBTool(img))
            .catch(() => 0);
    }
    createDoubleDib2D(dir: PathInfo, hspace: number, fileName: string): number | Promise<number> {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        return readFile(dir.resolve(fileName), "dbm")
            .then((img) => scene.createDoubleDIBTool(img))
            .catch(() => 0);
    }
    // Мышь
    // LoadCursor(HANDLE HSpace, STRING Filename)
    // LoadCursor(STRING WindowName, STRING Filename)
    loadCursor(dir: PathInfo, wnameOrHspace: string | number, filename: string): void {
        const req = this.handlers.cursorRequest;
        if (!req) return;
        const scene = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace) : this.windows.get(wnameOrHspace)?.scene;
        if (!scene) return;
        const cursor = req(dir.resolve(filename).toString());
        scene.setCursor(cursor || "default");
    }
    createObjectFromFile2D(dir: PathInfo, hspace: number, fileName: string, x: number, y: number, flags: number): number | Promise<number> {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        return readFile(dir.resolve(fileName), "vdr")
            .then((vdr) => scene.insertVectorDrawing(x, y, flags, vdr))
            .catch(() => 0);
    }
    createStream(dir: PathInfo, type: string, name: string, flags: string): number | Promise<number> {
        const t = type.toUpperCase();

        const needCreate = flags.toUpperCase().includes("CREATE");

        const handle = HandleMap.getFreeHandle(this.streams);
        if (t === "FILE") {
            const f = dir.resolve(name);
            return (async () => {
                let stream: EnvStream;
                if (needCreate) {
                    const file = await f.fs.createFile(f);
                    if (!file) throw Error(`Не удалось создать файл ${f}.`);
                    stream = new EnvStream({ file });
                } else {
                    const file = f.fs.file(f);
                    const buf = await file?.read();
                    if (!file || !buf) throw Error(`Файл ${f} не существует.`);
                    stream = new EnvStream({ data: buf, file: file });
                }
                this.streams.set(handle, stream);
                return handle;
            })();
        }
        if (t === "MEMORY") {
            this.streams.set(handle, new EnvStream());
            return handle;
        }
        throw Error(`Поток типа ${t} не поддерживается`);
    }
    mSaveAs(dir: PathInfo, q: number, fileName: string, flag: number): NumBool | Promise<NumBool> {
        if (flag <= 0) return 0;
        throw Error("Сохранение матриц не реализовано");
    }
    mLoad(dir: PathInfo, q: number, fileName: string, flag: number): number | Promise<number> {
        if (flag <= 0) return 0;

        return readFile(dir.resolve(fileName), "mat")
            .then((mat) => {
                const handle = q === 0 ? HandleMap.getFreeNegativeHandle(this.matrices) : q;
                this.matrices.set(handle, new NeoMatrix(mat));
                return handle;
            })
            .catch(() => 0);
    }

    setCapture(target: EventSubscriber, hspace: number, flags: number): void {
        const scene = this.scenes.get(hspace)?.scene;
        if (scene) (this.targetScene = scene).setCapture(target);
    }
    subscribe(target: EventSubscriber, wnameOrHspace: string | number, obj2d: number, message: number, flags: number): void {
        return;
        const wnd = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace)?.wnd : this.windows.get(wnameOrHspace);
        wnd?.on(target, message, flags & 1 ? obj2d : 0);
    }
    unsubscribe(target: EventSubscriber, wnameOrHspace: string | number, message: number): void {
        return;
        const wnd = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace)?.wnd : this.windows.get(wnameOrHspace);
        wnd?.off(target, message);
    }

    private async loadProject(prjFile: PathInfo): Promise<void> {
        if (this.loading) return;

        const c = document.body.style.cursor;
        document.body.style.cursor = "wait";
        try {
            const data = await Enviroment.loadProjectResources(prjFile, { id: this.nextSessionId(), lib: this.classes });
            if (this._shouldQuit) return;
            this.projects.push(new Project(this, data));
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = null;
            document.body.style.cursor = c;
        }
    }

    private lastOpenPopup = "";
    hyperCall(prj: Project, hyp: Hyperbase | null, point: Point2D): void {
        if (this.lastOpenPopup) {
            this.windows.get(this.lastOpenPopup)?.close();
            this.lastOpenPopup = "";
        }
        if (this.loading || !hyp) return;

        switch (hyp.openMode ?? 0) {
            // Окно
            case 0: {
                const classname = hyp.target;
                if (!classname) break;
                const scheme = this.classes.get(classname)?.scheme();
                if (!scheme) break;

                const wname = hyp.windowName || ((scheme.settings?.style ?? 0) & WindowStyle.SWF_POPUP ? "PopupWindow" : "MainWindow");
                if (this.windows.has(wname)) return;
                this.openWindow(prj, wname, { useVdrSettings: true }, scheme, { x: point.x, y: point.y, w: 0, h: 0 });
                break;
            }
            // Windows-приложение
            case 1:
                const exePath = hyp.target;
                if (!exePath) break;
                console.warn(`Запуск Windows приложения ${prj.dir.resolve(exePath)} не реализован.`);
                break;
            // Открыть проект
            case 2:
                const prjPath = hyp.target;
                if (!prjPath) break;
                this.loading = this.loadProject(prj.dir.resolve(prjPath));
                break;
            // Ничего не делать.
            case 3:
                break;
            // Запуск системной команды
            case 4:
                const cmdPath = hyp.target;
                if (!cmdPath) break;
                console.warn(`Запуск команды ${prj.dir.resolve(cmdPath)} не реализован.`);
                break;
            default:
                console.warn("Неизвестный тип гиперперперехода");
                console.log(hyp);
        }
    }

    private openWindow(prj: Project, wname: string, attribs: WindowAttribs, vdr?: VectorDrawing | null, rect?: WindowRect): number {
        let scene: Scene;
        let pens: Map<number, PenTool>;
        let brushes: Map<number, BrushTool>;
        let objects: Map<number, SceneElement>;

        if (vdr) {
            scene = new this.constructors.scene({
                layers: vdr.layers,
                offsetX: vdr.origin.x,
                offsetY: vdr.origin.y,
            });
            pens = createPenTools(scene, this.constructors, vdr.penTools);
            brushes = createBrushTools(scene, this.constructors, vdr.brushTools);
            objects = createElements(scene, { pens, brushes }, this.constructors, vdr.elements);

            // const dibs = new Map(vdr.dibTools?.map((t) => [t.handle, new DIBTool(t)]));
            // const doubleDibs = new Map(vdr.doubleDibTools?.map((t) => [t.handle, new DIBTool(t)]));
            // const strings = new Map(vdr.stringTools?.map((t) => [t.handle, new StringTool(t)]));
            // const fonts = new Map(vdr.fontTools?.map((t) => [t.handle, new FontTool(t)]));
            // const texts = new Map(vdr.textTools?.map((t) => [t.handle, new TextTool(this, t)]));

            if (vdr.elementOrder) {
                scene.setElements(createElementOrder(vdr.elementOrder, objects));
            }
        } else {
            scene = new this.constructors.scene();
            pens = new Map();
            brushes = new Map();
            objects = new Map();
        }

        const wnd = this.host.append(scene.view, {
            hScroll: false,
            vScroll: false,
            isPopup: false,
            noCaption: false,
            noResize: false,
            title: wname,
            position: null,
            size: null,
        });
        if (wnd.on) {
            wnd.on("closed", () => this.removeWindow(wname));
        }

        const handle = HandleMap.getFreeHandle(this.scenes);

        const m = vdr?.crdSystem?.matrix;
        const wrapper: SceneWrapper = {
            pens,
            brushes,
            objects,
            scene,
            wnd,
            handle,
            wname,
            prj,
            title: wname,
            scale: 1,
            source: vdr?.source ?? null,
            matrix: m ?? null,
            invMatrix: m ? invertMatrix(m) : null,
        };

        // if (opts.popup) this.lastOpenPopup = wname;
        this.windows.set(wname, wrapper);
        this.scenes.set(handle, wrapper);
        return handle;
    }

    private openSubwindow(
        parent: SceneWindow<Project>,
        prj: Project,
        wname: string,
        attribs: WindowAttribs,
        rect: WindowRect,
        vdr?: VectorDrawing | null
    ): number {
        const handle = HandleMap.getFreeHandle(this.scenes);
        const wnd = parent.subwindow({
            handle,
            wname,
            vdr,
            rect,
            attribs,
            onClosed: () => this.removeWindow(wname),
        });

        this.windows.set(wname, wnd);
        this.scenes.set(handle, wnd.scene);
        wnd.projectID = prj;
        wnd.scene.hyperHandler = prj;
        return handle;
    }

    private closeProjectWindows(prj: Project): void {
        const w2 = [...this.windows].filter((w) => {
            if (w[1].prj !== prj) return true;
            const wnd = w[1].wnd;
            if (wnd.close) wnd.close();
            return false;
        });
        this.windows = new Map(w2);
    }

    private removeWindow(wname: string): void {
        const wnd = this.windows.get(wname);
        if (!wnd) return;

        this.windows.delete(wname);
        this.scenes.delete(wnd.handle);
        if (wnd.scene === this.targetScene) {
            this.targetScene?.releaseCapture();
            this.targetScene = null;
        }
    }

    // private filterClosedWindows() {
    //     const wnds = [...this.windows].filter((w) => !w[1].closed);
    //     this.windows = new Map(wnds);
    //     this.scenes = new Map(wnds.map((w) => [w[1].sceneHandle, w[1].scene]));
    //     if (wnds.some((w) => w[1].scene === this.targetScene)) {
    //         this.targetScene?.releaseCapture();
    //         this.targetScene = null;
    //     }
    // }

    // Реализации функций.
    stratum_releaseCapture(): void {
        if (this.targetScene === null) return;
        this.targetScene.releaseCapture();
        this.targetScene = null;
    }

    //#region ФУНКЦИИ ПРОЧИЕ
    stratum_isDlgButtonChecked2d(hspace: number, hobject: number): number {
        return 0;
    }

    stratum_checkDlgButton2d(hspace: number, hobject: number, state: number): NumBool {
        return 1;
    }

    private setObjectAttribute2dShowed = false;
    stratum_setObjectAttribute2d(hspace: number, hobject: number, attr: number, flag: number): NumBool {
        if (!this.setObjectAttribute2dShowed) {
            console.warn("stratum_setObjectAttribute2d не реализована");
            this.setObjectAttribute2dShowed = true;
        }
        return 1;
    }
    stratum_setScrollRange(wname: string, type: number, min: number, max: number): NumBool {
        return 1;
    }

    //#endregion
    //#region ФУНКЦИИ СИСТЕМНЫЕ
    private systemShowed = false;
    stratum_system(command: number, ...params: number[]): number {
        if (!this.systemShowed) {
            console.warn(`Вызов System(${command}, ${params}) игнорируется`);
            this.systemShowed = true;
        }
        return 0;
    }

    stratum_shell(path: string, args: string, directory: string, flag: number): NumBool {
        this.handlers.shell.forEach((c) => c(path, args, directory, flag));
        return 1;
    }

    // Клавиатура
    stratum_getAsyncKeyState(vkey: number): number {
        if (vkey < 0 || vkey > Enviroment.keyState.length - 1) return 0;
        return Enviroment.keyState[vkey];
    }

    // Время
    stratum_getTickCount(): number {
        return new Date().getTime() - Enviroment.startupTime;
    }

    // Гиперпереход
    stratum_setHyperJump2d(hspace: number, hobject: number, mode: number, ...args: string[]): NumBool {
        if (mode < -1 || mode > 4) return 0;

        // const obj = this.scenes.get(hobject)?.objects.get(hobject)?;
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        if (mode === -1) {
            return scene.setHyper(hobject, null);
        }
        return scene.setHyper(hobject, {
            openMode: mode,
            target: args[0],
            objectName: args[1],
            effect: args[2],
            windowName: args[3],
            params: args[4],
        });
        // const path = args[0];
        // const objName = args[1];
        // const wname = args[3];
        // const opts = args[4];
        // if (objName) console.warn(`Сообщение WM_HYPERJUMP не было послано объекту ${objName}`);
        // if (wname) console.warn(`Гиперпереход: открывается окно ${wname}`);

        // console.log(obj);
        // return 1;
    }
    stratum_stdHyperJump(hspace: number, x: number, y: number, hobject: number /*, flags: number*/): void {
        this.scenes.get(hspace)?.tryHyper(x, y, hobject);
    }

    // Параметры экрана
    stratum_getScreenWidth(): number {
        return screen.width;
    }
    stratum_getScreenHeight(): number {
        return screen.height;
    }
    stratum_getWorkAreaX(): number {
        return 0;
    }
    stratum_getWorkAreaY(): number {
        return 0;
    }
    stratum_getWorkAreaWidth(): number {
        return this.host.width || window.innerWidth;
    }
    stratum_getWorkAreaHeight(): number {
        return this.host.height || window.innerHeight;
    }

    // Параметры окна.
    stratum_getTitleHeight(): number {
        return 0;
    }
    stratum_getSmallTitleHeight(): number {
        return 0;
    }
    stratum_getFixedFrameWidth(): number {
        return 0;
    }
    stratum_getFixedFrameHeight(): number {
        return 0;
    }
    stratum_getSizeFrameWidth(): number {
        return 0;
    }
    stratum_getSizeFrameHeight(): number {
        return 0;
    }

    // Лог
    stratum_logMessage(msg: string): void {
        options.log("Инфо: " + msg);
    }
    //#endregion

    //#region ФУНКЦИИ ОКОН
    // FLOAT SetWindowRegion(STRING WindowName, HANDLE RegionMatrix)
    // FLOAT SetWindowRegion(HANDLE HSpace, HANDLE RegionMatrix
    private setWindowRegionShowed = false;
    stratum_setWindowRegion(hspaceOrWname: string | number, pointsArray: number): NumBool {
        if (!this.setWindowRegionShowed) {
            console.warn("SetWindowRegion не реализована");
            this.setWindowRegionShowed = true;
        }
        return 1;
    }
    stratum_getClientHeight(wname: string): number {
        const wnd = this.windows.get(wname)?.wnd;
        return wnd?.clientHeight ? wnd.clientHeight() : 0;
    }
    stratum_getClientWidth(wname: string): number {
        const wnd = this.windows.get(wname)?.wnd;
        return wnd?.clientWidth ? wnd.clientWidth() : 0;
    }
    stratum_getWindowName(hspace: number): string {
        return this.scenes.get(hspace)?.wname ?? "";
    }
    stratum_getWindowOrgX(wname: string): number {
        const wnd = this.windows.get(wname)?.wnd;
        return wnd?.originX ? wnd.originX() : 0;
    }
    stratum_getWindowOrgY(wname: string): number {
        const wnd = this.windows.get(wname)?.wnd;
        return wnd?.originY ? wnd.originY() : 0;
    }
    stratum_getWindowSpace(wname: string): number {
        return this.windows.get(wname)?.handle ?? 0;
    }
    stratum_getWindowWidth(wname: string): number {
        const wnd = this.windows.get(wname)?.wnd;
        return wnd?.width ? wnd.width() : 0;
    }
    stratum_getWindowHeight(wname: string): number {
        const wnd = this.windows.get(wname)?.wnd;
        return wnd?.height ? wnd.height() : 0;
    }
    stratum_getWindowTitle(wname: string): string {
        return this.windows.get(wname)?.title ?? "";
    }

    stratum_setClientSize(wname: string, width: number, height: number): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        if (wnd.setClientSize) wnd.setClientSize(width, height);
        return 1;
    }
    stratum_setWindowSize(wname: string, width: number, height: number): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        if (wnd.setSize) wnd.setSize(width, height);
        return 1;
    }
    stratum_setWindowOrg(wname: string, orgX: number, orgY: number): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        if (wnd.setOrigin) wnd.setOrigin(orgX, orgY);
        return 1;
    }
    stratum_setWindowPos(wname: string, orgX: number, orgY: number, width: number, height: number): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        if (wnd.setOrigin) wnd.setOrigin(orgX, orgY);
        if (wnd.setSize) wnd.setSize(width, height);
        return 1;
    }
    stratum_setWindowTitle(wname: string, title: string): NumBool {
        const w = this.windows.get(wname);
        if (!w) return 0;
        w.title = title;
        if (w.wnd.setTitle) w.wnd.setTitle(title);
        return 1;
    }

    stratum_getWindowProp(wname: string, prop: string): string {
        const src = this.windows.get(wname)?.source;
        if (!src) return "";

        const propUC = prop.toUpperCase();
        const useProp = (propUC === "CLASSNAME" && src.origin === "class") || (propUC === "FILENAME" && src.origin === "file");
        return useProp ? src.name : "";
    }
    stratum_isWindowExist(wname: string): NumBool {
        return this.windows.has(wname) ? 1 : 0;
    }
    stratum_bringWindowToTop(wname: string): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        if (wnd.toTop) wnd.toTop();
        return 1;
    }
    stratum_showWindow(wname: string, flag: number): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        switch (flag) {
            case Constant.SW_HIDE:
                if (wnd.setVisibility) wnd.setVisibility(false);
                break;
            case Constant.SW_SHOW:
            case Constant.SW_NORMAL:
                if (wnd.setVisibility) wnd.setVisibility(true);
                break;
        }
        return 1;
    }
    stratum_closeWindow(wname: string): NumBool {
        const wnd = this.windows.get(wname)?.wnd;
        if (!wnd) return 0;
        if (wnd.close) wnd.close();
        return 1;
    }
    stratum_setWindowTransparent(wname: string, level: number): NumBool;
    stratum_setWindowTransparent(hspace: number, level: number): NumBool;
    stratum_setWindowTransparent(wnameOrHspace: number | string, level: number): NumBool {
        const wnd = (typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace) : this.windows.get(wnameOrHspace))?.wnd;
        if (!wnd) return 0;
        if (wnd.setTransparent) wnd.setTransparent(level);
        return 1;
    }
    stratum_setWindowTransparentColor(wname: string, cref: number): NumBool;
    stratum_setWindowTransparentColor(hspace: number, cref: number): NumBool;
    stratum_setWindowTransparentColor(wnameOrHspace: number | string, cref: number): NumBool {
        const wnd = (typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace) : this.windows.get(wnameOrHspace))?.wnd;
        if (!wnd) return 0;
        const r = crefToR(cref);
        const g = crefToG(cref);
        const b = crefToB(cref);
        if (wnd.setBackground) wnd.setBackground(r, g, b);
        return 1;
    }
    private setWindowOwnerwarnShowed = false;
    stratum_setWindowOwner(hspace: number, hownerSpace: number): NumBool {
        if (hspace === 0 || hownerSpace === 0) return 1;
        if (this.setWindowOwnerwarnShowed) return 1;
        console.warn(`setWindowOwner(${hspace},${hownerSpace} не реализована)`);
        this.setWindowOwnerwarnShowed = true;
        return 1;
    }
    //#endregion

    //#region ФУНКЦИИ ГРАФИКИ
    // Пространства
    //
    stratum_saveRectArea2d(hspace: number, filename: string, /*bits*/ _: number, x: number, y: number, width: number, height: number): NumBool {
        const scene = this.scenes.get(hspace);
        if (!scene) return 0;

        const url = scene.toDataURL(x, y, width, height);
        if (!url) return 0;

        const element = document.createElement("a");
        element.setAttribute("href", url);
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return 1;
    }
    stratum_getSpaceOrg2dx(hspace: number): number {
        return this.scenes.get(hspace)?.scene.offsetX() ?? 0;
    }
    stratum_getSpaceOrg2dy(hspace: number): number {
        return this.scenes.get(hspace)?.scene.offsetY() ?? 0;
    }
    stratum_setSpaceOrg2d(hspace: number, x: number, y: number): NumBool {
        const scene = this.scenes.get(hspace)?.scene;
        if (!scene) return 0;
        scene.setOffset(x, y);
        return 1;
    }
    stratum_getScaleSpace2d(hspace: number): number {
        return this.scenes.get(hspace)?.scale ?? 0;
    }
    stratum_setScaleSpace2d(hspace: number, ms: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        w.scale = ms;
        return 1;
    }
    // stratum_emptySpace2d(hspace: number): NumBool {
    //     const scene = this.scenes.get(hspace);
    //     return typeof scene !== "undefined" ? scene.clear() : 0;
    // }
    stratum_getBkBrush2d(hspace: number): number {
        return this.scenes.get(hspace)?.scene.brush.tool()?.handle ?? 0;
    }
    stratum_setBkBrush2d(hspace: number, hBrush: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        w.scene.brush.setTool(w.brushes.get(hBrush));
        return 1;
    }

    private lockSpace2dWarnShowed = false;
    stratum_lockSpace2d(hspace: number, lock: number): number {
        if (!this.lockSpace2dWarnShowed) {
            console.warn(`LockSpace2d(${hspace}, ${lock}) игнорируется`);
            this.lockSpace2dWarnShowed = true;
        }
        return 0;
    }

    // Инструменты
    //
    stratum_getToolRef2d(hspace: number, type: number, toolHandle: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        switch (type) {
            case Constant.PEN2D:
                return w.pens.get(toolHandle)?.subCount() ?? 0;
            case Constant.BRUSH2D:
                return w.brushes.get(toolHandle)?.subCount() ?? 0;
            case Constant.DIB2D:
                return this.getTDIB(hspace, toolHandle)?.subCount() ?? 0;
            case Constant.DOUBLEDIB2D:
                return this.getTDDoubleDIB(hspace, toolHandle)?.subCount() ?? 0;
            case Constant.TEXT2D:
                return this.getTText(hspace, toolHandle)?.subCount() ?? 0;
            case Constant.STRING2D:
                return this.getTString(hspace, toolHandle)?.subCount() ?? 0;
            case Constant.FONT2D:
                return this.getTFont(hspace, toolHandle)?.subCount() ?? 0;
            case Constant.SPACE3D:
                throw Error("Не реализовано");
        }
        return 0;
    }

    stratum_deleteTool2d(hspace: number, type: number, toolHandle: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        switch (type) {
            case Constant.PEN2D:
                return w.pens.delete(toolHandle) ? 1 : 0;
            case Constant.BRUSH2D:
                return w.brushes.delete(toolHandle) ? 1 : 0;
            case Constant.DIB2D:
                return w.dibs.delete(toolHandle) ? 1 : 0;
            case Constant.DOUBLEDIB2D:
                return w.doubleDibs.delete(toolHandle) ? 1 : 0;
            case Constant.TEXT2D:
                return w.texts.delete(toolHandle) ? 1 : 0;
            case Constant.STRING2D:
                return w.strings.delete(toolHandle) ? 1 : 0;
            case Constant.FONT2D:
                return w.fonts.delete(toolHandle) ? 1 : 0;
            case Constant.SPACE3D:
                throw Error("Не реализовано");
        }
        return 0;
    }

    // Инструмент Карандаш
    //
    stratum_createPen2d(hspace: number, style: number, width: number, color: number, rop2: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const handle = HandleMap.getFreeHandle(w.pens);
        w.pens.set(handle, new this.constructors.pen(w.scene, { handle, color, rop: rop2, style, width }));
        return handle;
    }

    stratum_getPenColor2d(hspace: number, hpen: number): number {
        return this.scenes.get(hspace)?.pens.get(hpen)?.color() ?? 0;
    }
    stratum_getPenRop2d(hspace: number, hpen: number): number {
        return this.scenes.get(hspace)?.pens.get(hpen)?.rop() ?? 0;
    }
    stratum_getPenStyle2d(hspace: number, hpen: number): number {
        return this.scenes.get(hspace)?.pens.get(hpen)?.style() ?? 0;
    }
    stratum_getPenWidth2d(hspace: number, hpen: number): number {
        return this.scenes.get(hspace)?.pens.get(hpen)?.width() ?? 0;
    }

    stratum_setPenColor2d(hspace: number, hpen: number, color: number): NumBool {
        const p = this.scenes.get(hspace)?.pens.get(hpen);
        if (!p) return 0;
        p.setColor(color);
        return 1;
    }
    stratum_setPenRop2d(hspace: number, hpen: number, rop: number): NumBool {
        const p = this.scenes.get(hspace)?.pens.get(hpen);
        if (!p) return 0;
        p.setRop(rop);
        return 1;
    }
    stratum_setPenStyle2d(hspace: number, hpen: number, style: number): NumBool {
        const p = this.scenes.get(hspace)?.pens.get(hpen);
        if (!p) return 0;
        p.setStyle(style);
        return 1;
    }
    stratum_setPenWidth2d(hspace: number, hpen: number, width: number): NumBool {
        const p = this.scenes.get(hspace)?.pens.get(hpen);
        if (!p) return 0;
        p.setWidth(width);
        return 1;
    }

    // Инструмент Кисть
    //
    // WIP: hdib
    stratum_createBrush2d(hspace: number, style: number, hatch: number, color: number, hdib: number, type: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const handle = HandleMap.getFreeHandle(w.brushes);
        w.brushes.set(handle, new this.constructors.brush(w.scene, { handle, color, hatch, style, rop: type }));
        return handle;
    }

    stratum_getBrushColor2d(hspace: number, hbrush: number): number {
        return this.scenes.get(hspace)?.brushes.get(hbrush)?.color() ?? 0;
    }
    stratum_getBrushRop2d(hspace: number, hbrush: number): number {
        return this.scenes.get(hspace)?.brushes.get(hbrush)?.rop() ?? 0;
    }
    stratum_getBrushStyle2d(hspace: number, hbrush: number): number {
        return this.scenes.get(hspace)?.brushes.get(hbrush)?.style() ?? 0;
    }
    stratum_getBrushHatch2d(hspace: number, hbrush: number): number {
        return this.scenes.get(hspace)?.brushes.get(hbrush)?.hatch() ?? 0;
    }
    stratum_getBrushDib2d(hspace: number, hbrush: number): number {
        // WIP:
        return 0;
    }

    stratum_setBrushColor2d(hspace: number, hbrush: number, color: number): NumBool {
        const b = this.scenes.get(hspace)?.brushes.get(hbrush);
        if (!b) return 0;
        b.setColor(color);
        return 1;
    }
    stratum_setBrushRop2d(hspace: number, hbrush: number, rop: number): NumBool {
        const b = this.scenes.get(hspace)?.brushes.get(hbrush);
        if (!b) return 0;
        b.setRop(rop);
        return 1;
    }
    stratum_setBrushStyle2d(hspace: number, hbrush: number, style: number): NumBool {
        const b = this.scenes.get(hspace)?.brushes.get(hbrush);
        if (!b) return 0;
        b.setStyle(style);
        return 1;
    }
    stratum_setBrushHatch2d(hspace: number, hbrush: number, hatch: number): NumBool {
        const b = this.scenes.get(hspace)?.brushes.get(hbrush);
        if (!b) return 0;
        b.setHatch(hatch);
        return 1;
    }
    // WIP: hdib
    stratum_setBrushDib2d(hspace: number, hbrush: number, hdib: number): NumBool {
        const b = this.scenes.get(hspace)?.brushes.get(hbrush);
        if (!b) return 0;
        // b.setColor(color);
        return 1;
    }

    // Инструмент Шрифт
    //
    stratum_createFont2D(hspace: number, fontName: string, height: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createFontTool(fontName, height, flags) : 0;
    }
    //FIXME: эта функия работает иначе: см. доки.
    stratum_createFont2Dpt(hspace: number, fontName: string, size: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createFontTool(fontName, size, flags) : 0;
    }

    stratum_getFontName2d(hspace: number, hfont: number): string {
        const f = this.getTFont(hspace, hfont);
        return typeof f !== "undefined" ? f.name() : "";
    }
    stratum_getFontSize2d(hspace: number, hfont: number): number {
        const f = this.getTFont(hspace, hfont);
        // FIXME: возвращает 0 в некоторых случаях.
        return typeof f !== "undefined" ? f.size() : 0;
    }
    stratum_getFontStyle2d(hspace: number, hfont: number): number {
        const f = this.getTFont(hspace, hfont);
        return typeof f !== "undefined" ? f.style() : 0;
    }

    stratum_setFontName2d(hspace: number, hfont: number, fontName: string): NumBool {
        const f = this.getTFont(hspace, hfont);
        return typeof f !== "undefined" ? f.setName(fontName) : 0;
    }
    stratum_setFontSize2d(hspace: number, hfont: number, size: number): NumBool {
        const f = this.getTFont(hspace, hfont);
        return typeof f !== "undefined" ? f.setSize(size) : 0;
    }
    stratum_setFontStyle2d(hspace: number, hfont: number, flags: number): NumBool {
        const f = this.getTFont(hspace, hfont);
        return typeof f !== "undefined" ? f.setStyle(flags) : 0;
    }

    // Инструмент Строка
    //
    stratum_createString2D(hspace: number, value: string): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createStringTool(value) : 0;
    }
    stratum_getstring2d(hspace: number, hstring: number): string {
        const s = this.getTString(hspace, hstring);
        return typeof s !== "undefined" ? s.text() : "";
    }
    stratum_setString2d(hspace: number, hstring: number, value: string): NumBool {
        const s = this.getTString(hspace, hstring);
        return typeof s !== "undefined" ? s.setText(value) : 0;
    }

    // Инструмент Текст
    //
    stratum_createText2D(hspace: number, hfont: number, hstring: number, fgColor: number, bgColor: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createTextTool(hfont, hstring, fgColor, bgColor) : 0;
    }
    stratum_createRasterText2D(hspace: number, htext: number, x: number, y: number, angle: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createText(x, y, angle, htext) : 0;
    }

    stratum_getTextObject2d(hspace: number, hojbect: number): number {
        const obj = this.getObject(hspace, hojbect);
        return typeof obj !== "undefined" ? obj.textToolHandle() : 0;
    }
    stratum_getTextCount2d(hspace: number, htext: number): number {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.textCount() : 0;
    }

    stratum_getTextFont2d(hspace: number, htext: number, index: number = 0): number {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.fontHandle(index) : 0;
    }
    stratum_getTextString2d(hspace: number, htext: number, index: number = 0): number {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.stringHandle(index) : 0;
    }
    stratum_getTextFgColor2d(hspace: number, htext: number, index: number = 0): number {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.fgColor(index) : 0;
    }
    stratum_getTextBkColor2d(hspace: number, htext: number, index: number = 0): number {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.bgColor(index) : 0;
    }

    stratum_setText2D(hspace: number, htext: number, /*          */ hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    stratum_setText2D(hspace: number, htext: number, index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    stratum_setText2D(hspace: number, htext: number, a1: number, a2: number, a3: number, a4: number, a5?: number): NumBool {
        const t = this.getTText(hspace, htext);
        if (typeof t === "undefined") return 0;

        const index = typeof a5 !== "undefined" ? a1 : 0;
        const hfont = typeof a5 !== "undefined" ? a2 : a1;
        const hstring = typeof a5 !== "undefined" ? a3 : a2;
        const fgColor = typeof a5 !== "undefined" ? a4 : a3;
        const bgColor = typeof a5 !== "undefined" ? a5 : a4;

        return t.setValues(index, hfont, hstring, fgColor, bgColor);
    }

    stratum_setTextFgColor2d(hspace: number, htext: number, index: number, fgColor: number): NumBool {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.setFgColor(index, fgColor) : 0;
    }
    stratum_setTextBkColor2d(hspace: number, htext: number, index: number, bgColor: number): NumBool {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.setBgColor(index, bgColor) : 0;
    }
    stratum_setTextFont2d(hspace: number, htext: number, index: number, hfont: number): NumBool {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.setFont(index, hfont) : 0;
    }
    stratum_setTextString2d(hspace: number, htext: number, index: number, hstring: number): NumBool {
        const t = this.getTText(hspace, htext);
        return typeof t !== "undefined" ? t.setString(index, hstring) : 0;
    }

    // Инструмент Битовая карта
    //

    stratum_getDibPixel2D(hspace: number, hdib: number, x: number, y: number): number {
        const d = this.getTDIB(hspace, hdib);
        return typeof d !== "undefined" ? d.getPixel(x, y) : 0;
    }
    stratum_setDibPixel2D(hspace: number, hdib: number, x: number, y: number, colorref: number): number {
        const d = this.getTDIB(hspace, hdib);
        return typeof d !== "undefined" ? d.setPixel(x, y, colorref) : 0;
    }

    // Двойная битовая карта
    //

    // Объект Битмап
    //
    stratum_createBitmap2d(hspace: number, hdib: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createBitmap(x, y, hdib, false) : 0;
    }
    stratum_createDoubleBitmap2D(hspace: number, hdib: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createBitmap(x, y, hdib, true) : 0;
    }

    stratum_setBitmapSrcRect2d(hspace: number, hobject: number, x: number, y: number, width: number, height: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setBitmapRect(x, y, width, height) : 0;
    }

    stratum_getDibObject2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.dibHandle() : 0;
    }
    stratum_getDDibObject2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.doubleDIBHandle() : 0;
    }

    stratum_rgbEx(r: number, g: number, b: number, type: number): number {
        return rgbToCref(r, g, b, type);
    }
    stratum_rgb(r: number, g: number, b: number): number {
        return rgbToCref(r, g, b, 0);
    }
    stratum_getRValue(cref: number): number {
        return crefToR(cref);
    }
    stratum_getGValue(cref: number): number {
        return crefToG(cref);
    }
    stratum_getBValue(cref: number): number {
        return crefToB(cref);
    }

    // Функции для работы с графическими объектами
    //
    stratum_copyToClipboard2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.copy(hobject) : 0;
    }
    stratum_pasteFromClipboard2d(hspace: number, x: number, y: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.paste(x, y, flags) : 0;
    }
    stratum_getNextObject2d(hspace: number, hobject: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.next(hobject) : 0;
    }

    private static deleteElems(elements: readonly SceneElement[], s: WeakSet<SceneElement>): void {
        for (const c of elements) {
            s.add(c);
            if (c.type === "group") {
                Enviroment.deleteElems(c.children() as readonly SceneElement[], s);
            }
        }
    }
    stratum_deleteObject2d(hspace: number, hobject: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj) return 0;

        const p = obj.parent();
        if (p) {
            p.setChildren(p.children().filter((o) => o !== obj));
        }
        const s = new WeakSet([obj]);
        switch (obj.type) {
            case "group":
                Enviroment.deleteElems(obj.children() as SceneElement[], s);
                break;
            case "line":
                obj.pen.setTool(null);
                obj.brush.setTool(null);
                break;
            // WIP: добавить типов
        }
        w.objects = new Map([...w.objects].filter((o) => !s.has(o[1])));
        w.scene.setElements(w.scene.elements().filter((e) => !s.has(e)));
        return 1;
    }

    stratum_getObjectName2d(hspace: number, hobject: number): string {
        return this.scenes.get(hspace)?.objects.get(hobject)?.name ?? "";
    }
    stratum_setObjectName2d(hspace: number, hobject: number, name: string): NumBool {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        obj.name = name;
        return 1;
    }
    private static searchIn(name: string, elements: readonly SceneElement[]): SceneElement | null {
        for (const c of elements) {
            if (c.name === name) return c;
            if (c.type === "group") {
                const res = Enviroment.searchIn(name, c.children() as readonly SceneElement[]);
                if (res) return res;
            }
        }
        return null;
    }
    stratum_getObject2dByName(hspace: number, hgroup: number, name: string): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        if (!hgroup) {
            for (const [handle, obj] of w.objects) if (obj.name === name) return handle;
            return 0;
        }

        const group = w.objects.get(hgroup);
        if (group?.type !== "group") return 0;
        return Enviroment.searchIn(name, group.children() as readonly SceneElement[])?.handle ?? 0;
    }

    stratum_getObjectType2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;

        switch (obj.type) {
            case "group":
                return Constant.OTGROUP2D;
            case "line":
                return Constant.OTLINE_2D;
            // WIP
        }
    }
    stratum_setObjectOrg2d(hspace: number, hobject: number, x: number, y: number): NumBool {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;
        const obj = wrapper.objects.get(hobject);
        if (!obj) return 0;

        const mat = wrapper.matrix;
        if (!mat) {
            obj.move(x, y);
            return 1;
        }

        const w = x * mat[2] + y * mat[5] + mat[8];
        const newX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const newY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        obj.move(newX, newY);
        return 1;
    }
    stratum_getObjectOrg2dx(hspace: number, hobject: number): number {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;
        const obj = wrapper.objects.get(hobject);
        if (!obj) return 0;

        const mat = wrapper.invMatrix;
        if (!mat) return obj.x();

        const x = obj.x();
        const y = obj.y();
        const w = x * mat[2] + y * mat[5] + mat[8];
        return (x * mat[0] + y * mat[3] + mat[6]) / w;
    }
    stratum_getObjectOrg2dy(hspace: number, hobject: number): number {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;
        const obj = wrapper.objects.get(hobject);
        if (!obj) return 0;

        const mat = wrapper.invMatrix;
        if (!mat) return obj.y();

        const x = obj.x();
        const y = obj.y();
        const w = x * mat[2] + y * mat[5] + mat[8];
        return (x * mat[1] + y * mat[4] + mat[7]) / w;
    }

    stratum_setObjectSize2d(hspace: number, hobject: number, sizeX: number, sizeY: number): NumBool {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        obj.size(sizeX, sizeY);
        return 1;
    }
    stratum_getObjectWidth2d(hspace: number, hobject: number): number {
        return this.scenes.get(hspace)?.objects.get(hobject)?.width() ?? 0;
    }
    stratum_getObjectHeight2d(hspace: number, hobject: number): number {
        return this.scenes.get(hspace)?.objects.get(hobject)?.height() ?? 0;
    }
    stratum_getActualHeight2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
            case "line":
                return obj.height();
        }
        // WIP:
    }
    stratum_getActualWidth2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
            case "line":
                return obj.width();
        }
        // WIP:
    }

    stratum_getObjectAngle2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
            case "line":
                return 0;
        }
        // WIP:
    }
    stratum_rotateObject2d(hspace: number, hobject: number, centerX: number, centerY: number, angle: number): NumBool {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;
        const obj = wrapper.objects.get(hobject);
        if (!obj) return 0;

        const mat = wrapper.matrix;
        if (!mat) {
            obj.rotate(centerX, centerY, angle);
            return 1;
        }

        const w = centerX * mat[2] + centerY * mat[5] + mat[8];
        const newX = (centerX * mat[0] + centerY * mat[3] + mat[6]) / w;
        const newY = (centerX * mat[1] + centerY * mat[4] + mat[7]) / w;
        obj.rotate(newX, newY, angle);
        return 1;
    }

    private static showElems(elements: readonly SceneElement[], visible: boolean): void {
        for (const c of elements) {
            if (c.type === "group") {
                Enviroment.showElems(c.children() as readonly SceneElement[], visible);
                continue;
            }
            c.visib.setVisible(visible);
        }
    }

    private setShow(hspace: number, hobject: number, visible: boolean) {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
                Enviroment.showElems(obj.children() as readonly SceneElement[], visible);
                break;
            default:
                obj.visib.setVisible(visible);
        }
        return 1;
    }

    stratum_setShowObject2d(hspace: number, hobject: number, visible: number): NumBool {
        return this.setShow(hspace, hobject, visible !== 0);
    }
    stratum_showObject2d(hspace: number, hobject: number): NumBool {
        return this.setShow(hspace, hobject, true);
    }
    stratum_hideObject2d(hspace: number, hobject: number): NumBool {
        return this.setShow(hspace, hobject, false);
    }

    stratum_getObjectFromPoint2d(hspace: number, x: number, y: number): number {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;

        let newX = x;
        let newY = y;
        const mat = wrapper.matrix;
        if (mat) {
            const w = x * mat[2] + y * mat[5] + mat[8];
            newX = (x * mat[0] + y * mat[3] + mat[6]) / w;
            newY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }

        const obj = wrapper.scene.elementAtPoint(newX, newY);
        if (!obj) {
            this.lastPrimary = 0;
            return 0;
        }
        this.lastPrimary = obj.handle;

        let res: SceneElement = obj;
        while (res) {
            const par = res.parent();
            if (!par) break;
            res = par;
        }
        return res.handle;
    }
    stratum_getLastPrimary2d(): number {
        return this.lastPrimary;
    }

    // Функции для управления Z-порядком графических объектов
    //
    stratum_getBottomObject2d(hspace: number): number {
        const scene = this.scenes.get(hspace)?.scene;
        if (!scene) return 0;
        const e = scene.elements();
        return e.length > 0 ? e[0].handle : 0;
    }
    stratum_getTopObject2d(hspace: number): number {
        const scene = this.scenes.get(hspace)?.scene;
        if (!scene) return 0;
        const e = scene.elements();
        return e.length > 0 ? e[e.length - 1].handle : 0;
    }
    stratum_getLowerObject2d(hspace: number, hobject: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj || obj.type === "group") return 0;

        const e = w.scene.elements();
        const idx = e.indexOf(obj);
        return idx < 1 ? 0 : e[idx - 1].handle;
    }
    stratum_getUpperObject2d(hspace: number, hobject: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj || obj.type === "group") return 0;

        const e = w.scene.elements();
        const idx = e.indexOf(obj);
        return idx > -1 && idx < e.length - 1 ? e[idx + 1].handle : 0;
    }
    stratum_getObjectFromZOrder2d(hspace: number, zOrder: number): number {
        const realZ = zOrder - 1;
        if (realZ < 0) return 0;
        const scene = this.scenes.get(hspace)?.scene;
        if (!scene) return 0;
        const e = scene.elements();
        return realZ < e.length ? e[realZ].handle : 0;
    }
    stratum_getZOrder2d(hspace: number, hobject: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj || obj.type === "group") return 0;

        const e = w.scene.elements();
        const idx = e.indexOf(obj);
        return idx < 0 ? 0 : idx + 1;
    }
    stratum_setZOrder2d(hspace: number, hobject: number, zOrder: number): NumBool {
        const realZ = zOrder - 1;
        if (realZ < 0) return 0;

        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj || obj.type === "group") return 0;

        const e = w.scene.elements();

        const res: PrimaryElement[] = [];
        for (let i = 0; i < e.length; ++i) {
            if (i === realZ) res.push(obj);
            const cur = e[i];
            if (cur !== obj) res.push(cur);
        }
        if (realZ >= e.length) res.push(obj);
        w.scene.setElements(res);
        return 1;
    }
    stratum_objectToBottom2d(hspace: number, hobject: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj || obj.type === "group") return 0;

        w.scene.setElements([obj, ...w.scene.elements().filter((e) => e !== obj)]);
        return 1;
    }
    stratum_objectToTop2d(hspace: number, hobject: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const obj = w.objects.get(hobject);
        if (!obj || obj.type === "group") return 0;

        w.scene.setElements([...w.scene.elements().filter((e) => e !== obj), obj]);
        return 1;
    }
    stratum_swapObject2d(hspace: number, hobj1: number, hobj2: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const obj1 = w.objects.get(hobj1);
        if (!obj1 || obj1.type === "group") return 0;
        const obj2 = w.objects.get(hobj2);
        if (!obj2 || obj2.type === "group") return 0;

        const e = w.scene.elements().slice();
        const idx1 = e.indexOf(obj1);
        if (idx1 < 0) return 0;
        const idx2 = e.indexOf(obj2);
        if (idx2 < 0) return 0;

        const c = e[idx1];
        e[idx1] = e[idx2];
        e[idx2] = c;

        w.scene.setElements(e);
        return 1;
    }

    private createLine(hspace: number, hpen: number, hbrush: number, coordinates: readonly number[]): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        let coords = coordinates;
        const mat = w.matrix;
        if (mat) {
            const realCoords = coords.slice();
            for (let i = 0; i < coords.length; i += 2) {
                const x = coords[i];
                const y = coords[i + 1];
                const w = x * mat[2] + y * mat[5] + mat[8];
                realCoords[i] = (x * mat[0] + y * mat[3] + mat[6]) / w;
                realCoords[i + 1] = (x * mat[1] + y * mat[4] + mat[7]) / w;
            }
            coords = realCoords;
        }

        const pen = w.pens.get(hpen);
        const brush = w.brushes.get(hbrush);

        const handle = HandleMap.getFreeHandle(w.objects);
        const line = new this.constructors.line(w.scene, coords, { handle, pen, brush });
        w.objects.set(handle, line);
        w.scene.setElements([...w.scene.elements(), line]);
        return handle;
    }

    // Функции для работы с полилиниями
    //
    stratum_createPolyLine2d(hspace: number, hpen: number, hbrush: number, ...coords: readonly number[]): number {
        return this.createLine(hspace, hpen, hbrush, coords);
    }
    stratum_createLine2d(hspace: number, hpen: number, hbrush: number, x: number, y: number): number {
        return this.createLine(hspace, hpen, hbrush, [x, y]);
    }
    stratum_addPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;

        const line = wrapper.objects.get(hline);
        if (line?.type !== "line") return 0;

        const mat = wrapper.matrix;
        if (!mat) {
            return line.add(index, x, y) ? 1 : 0;
        }

        const w = x * mat[2] + y * mat[5] + mat[8];
        const newX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const newY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        return line.add(index, newX, newY) ? 1 : 0;
    }
    stratum_delpoint2d(hspace: number, hline: number, index: number): NumBool {
        const line = this.scenes.get(hspace)?.objects.get(hline);
        return line?.type === "line" ? (line.delete(index) ? 1 : 0) : 0;
    }
    stratum_getPenObject2d(hspace: number, hline: number): number {
        const line = this.scenes.get(hspace)?.objects.get(hline);
        return line?.type === "line" ? line.pen.tool()?.handle ?? 0 : 0;
    }
    stratum_getBrushObject2d(hspace: number, hline: number): number {
        const line = this.scenes.get(hspace)?.objects.get(hline);
        return line?.type === "line" ? line.brush.tool()?.handle ?? 0 : 0;
    }
    stratum_getVectorNumPoints2d(hspace: number, hline: number): number {
        const line = this.scenes.get(hspace)?.objects.get(hline);
        return line?.type === "line" ? line.pointCount() : 0;
    }
    stratum_getVectorPoint2dx(hspace: number, hline: number, index: number): number {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;

        const line = wrapper.objects.get(hline);
        if (line?.type !== "line") return 0;

        const mat = wrapper.invMatrix;
        if (!mat) {
            return line.px(index);
        }

        const x = line.px(index);
        const y = line.py(index);
        const w = x * mat[2] + y * mat[5] + mat[8];
        return (x * mat[0] + y * mat[3] + mat[6]) / w;
    }
    stratum_getVectorPoint2dy(hspace: number, hline: number, index: number): number {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;

        const line = wrapper.objects.get(hline);
        if (line?.type !== "line") return 0;

        const mat = wrapper.invMatrix;
        if (!mat) {
            return line.py(index);
        }

        const x = line.px(index);
        const y = line.py(index);
        const w = x * mat[2] + y * mat[5] + mat[8];
        return (x * mat[1] + y * mat[4] + mat[7]) / w;
    }
    // stratum_setBrushObject2d(hspace : number, hline : number, hbrush : number) : NumBool {}
    // stratum_setPenObject2d(hspace : number, hline : number, hpen : number) : NumBool {}
    stratum_setVectorPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;

        const line = wrapper.objects.get(hline);
        if (line?.type !== "line") return 0;

        const mat = wrapper.matrix;
        if (!mat) {
            return line.update(index, x, y) ? 1 : 0;
        }

        const w = x * mat[2] + y * mat[5] + mat[8];
        const newX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const newY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        return line.update(index, newX, newY) ? 1 : 0;
    }

    // Функции для работы с группами
    stratum_createGroup2d(hspace: number, ...hobject: readonly number[]): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const children = new Set<SceneElement>();
        for (const h of hobject) {
            const obj = w.objects.get(h);
            if (!obj) return 0;
            children.add(obj);
        }

        const handle = HandleMap.getFreeHandle(w.objects);
        w.objects.set(handle, new GroupElement2D(w.scene, { handle, children: [...children] }));
        return handle;
    }
    stratum_deleteGroup2d(hspace: number, hgroup: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const group = w.objects.get(hgroup);
        if (group?.type !== "group") return 0;

        const p = group.parent();
        if (p) {
            p.setChildren(p.children().filter((o) => o !== group));
        }
        group.setChildren([]);
        w.objects.delete(hgroup);
        return 1;
    }

    stratum_addGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        if (hgroup === hobject) return 0;

        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const obj = w.objects.get(hobject);
        if (!obj || obj.parent()) return 0;

        const group = w.objects.get(hgroup);
        if (group?.type !== "group") return 0;

        if (obj.type === "group") {
            let p: GroupElement2D | null = group;
            while ((p = p.parent())) if (p === obj) return 0;
        }
        group.setChildren([...group.children(), obj]);
        return 1;
    }
    stratum_delGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        if (hgroup === hobject) return 0;

        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const group = w.objects.get(hgroup);
        if (group?.type !== "group") return 0;

        const obj = w.objects.get(hobject);
        if (obj?.parent() !== group) return 0;

        group.setChildren(group.children().filter((e) => e !== obj));
        return 1;
    }

    stratum_getGroupItemsNum2d(hspace: number, hgroup: number): number {
        const group = this.scenes.get(hspace)?.objects.get(hgroup);
        return group?.type === "group" ? group.children().length : 0;
    }
    stratum_getGroupItem2d(hspace: number, hgroup: number, index: number): number {
        if (index < 0) return 0;
        const group = this.scenes.get(hspace)?.objects.get(hgroup);
        if (group?.type !== "group") return 0;
        const c = group.children();
        return index < c.length ? c[index].handle : 0;
    }
    // stratum_setGroupItem2d(hspace: number, hgroup: number, index: number, hobject : number): NumBool {
    //     const obj = this.getObject(hspace, hgroup);
    //     return typeof obj !== "undefined" ? obj.itemHandle(index) : 0;
    // }
    // stratum_setGroupItems2d(hspace: number, hgroup: number, index: number, ...hobject: number[]): NumBool {
    //     const obj = this.getObject(hspace, hgroup);
    //     return typeof obj !== "undefined" ? obj.itemHandle(index) : 0;
    // }
    stratum_getObjectParent2d(hspace: number, hobject: number): number {
        return this.scenes.get(hspace)?.objects.get(hobject)?.parent()?.handle ?? 0;
    }
    // FLOAT IsGroupContainObject2d(HANDLE HSpace, HANDLE HGroup, HANDLE HObject)

    // Прочее
    //
    stratum_isObjectsIntersect2d(hspace: number, hobj1: number, hobj2: number /*flags: number*/): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const o1 = w.objects.get(hobj1);
        if (!o1) return 0;
        const o2 = w.objects.get(hobj2);
        if (!o2) return 0;

        const o1_minX = o1.x();
        const o1_maxX = o1_minX + o1.width();
        const o1_minY = o1.y();
        const o1_maxY = o1_minY + o1.height();

        const o2_minX = o2.x();
        const o2_maxX = o2_minX + o2.width();
        const o2_minY = o2.y();
        const o2_maxY = o2_minY + o2.height();

        return o1_maxX >= o2_minX && o2_maxX >= o1_minX && o1_maxY >= o2_minY && o2_maxY >= o1_minY ? 1 : 0;
    }

    // Объект Контрол
    stratum_createControlObject2d(hspace: number, className: string, text: string, style: number, x: number, y: number, width: number, height: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createControl(x, y, width, height, className, text, style) : 0;
    }

    stratum_setControlFont2d(hspace: number, hobject: number, hfont: number): NumBool {
        return this.getObject(hspace, hobject)?.setControlFont(hfont) ?? 0;
    }

    stratum_getControlText2d(hspace: number, hcontrol: number, begin?: number, length?: number): string {
        const obj = this.getObject(hspace, hcontrol);
        if (typeof obj === "undefined") return "";

        if (typeof begin === "undefined" || typeof length === "undefined") return obj.controlText();
        return obj.controlText().slice(begin, begin + length);
    }
    stratum_setControlText2d(hspace: number, hcontrol: number, text: string): NumBool {
        const obj = this.getObject(hspace, hcontrol);
        return typeof obj !== "undefined" ? obj.setControlText(text) : 0;
    }
    //#endregion

    //#region ФУНКЦИИ РАБОТЫ С ИМИДЖАМИ
    stratum_getObjectClass(classname: string, hobject: number): string {
        const cl = this.classes.get(classname);
        if (!cl) return "";
        const child = cl.children.find((c) => c.handle === hobject);
        return child ? child.classname : "";
    }
    stratum_getLink(classname: string, hobject1: number, hobject2: number): number {
        const cl = this.classes.get(classname);
        if (!cl) return 0;
        const link = cl.links.find((c) => (c.handle1 === hobject1 && c.handle2 === hobject2) || (c.handle1 === hobject2 && c.handle2 === hobject1));
        return link?.handle ?? 0;
    }
    stratum_getObjectCount(classname: string): number {
        return this.classes.get(classname)?.children.length ?? 0;
    }

    stratum_setModelText(classname: string, hstream: number, showError?: number): NumBool {
        const stream = this.streams.get(hstream);
        if (!stream) return 0;
        const cl = this.classes.get(classname);
        if (!cl) return 0;
        cl.setCode(stream.text());
        return 1;
    }

    stratum_getVarCount(classname: string): number {
        return this.classes.get(classname)?.vars().count() ?? 0;
    }

    stratum_getHObjectByNum(classname: string, index: number): number {
        if (index < 0) return 0;
        const children = this.classes.get(classname)?.children;
        if (!children || index > children.length - 1) return 0;
        return children[index].handle;
    }

    stratum_quit(flag: number): void {
        if (flag <= 0) return;
        this._shouldQuit = true;
    }
    //#endregion

    //#region ФУНКЦИИ РАБОТЫ С ФАЙЛАМИ
    stratum_addSlash(a: string): string {
        return a.length === 0 || a[a.length - 1] === "\\" ? a : a + "\\";
    }
    stratum_getClassDirectory(className: string): string {
        const path = this.classes.getPath(className);
        return path ? getDirectory(path) : "";
    }

    stratum_closeClassScheme(/*className: string*/): NumBool {
        return 1;
    }
    stratum_getWindowsDirectory(): string {
        return "C:\\Windows";
    }
    //#endregion

    //#region ФУНКЦИИ МУЛЬТИМЕДИА
    stratum_MCISendString(): number {
        return Constant.MCIERR_INVALID_DEVICE_NAME;
    }
    stratum_MCISendStringStr(): string {
        return "";
    }
    //#endregion

    //#region ФУНКЦИИ РАБОТЫ СО СТРОКАМИ (незаинлайненная часть)
    stratum_ascii(str: string): number {
        if (str.length === 0) return 0;
        const idx = win1251Table.indexOf(str[0]);
        return idx < 0 ? 0 : idx;
    }
    stratum_chr(n: number): string {
        if (n < 0 || n > 255) return "";
        return win1251Table[n];
    }
    //#endregion

    //#region ФУНКЦИИ УПРАВЛЕНИЯ ПОТОКАМИ
    stratum_async_closeStream(hstream: number): NumBool | Promise<NumBool> {
        const st = this.streams.get(hstream);
        if (!st) return 0;
        this.streams.delete(hstream);
        const r = st.close();
        if (r instanceof Promise) return r.then((res) => (res ? 1 : 0));
        return r ? 1 : 0;
    }
    stratum_seek(hstream: number, pos: number): number {
        return this.streams.get(hstream)?.seek(pos) ?? 0;
    }
    // stratum_streamStatus(hstream: number): number {
    //     return 0;
    // }
    stratum_eof(hstream: number): NumBool {
        return this.streams.get(hstream)?.eof() ?? 0;
    }
    stratum_getPos(hstream: number): number {
        return this.streams.get(hstream)?.pos() ?? 0;
    }
    stratum_getSize(hstream: number): number {
        return this.streams.get(hstream)?.size() ?? 0;
    }
    stratum_setWidth(hstream: number, width: number): NumBool {
        return this.streams.get(hstream)?.setWidth(width) ?? 0;
    }
    stratum_read(hstream: number): number {
        return this.streams.get(hstream)?.widthNumber() ?? 0;
    }
    stratum_readLn(hstream: number): string {
        return this.streams.get(hstream)?.line() ?? "";
    }
    stratum_write(hstream: number, val: number): number {
        return this.streams.get(hstream)?.writeWidthNumber(val) ?? 0;
    }
    stratum_writeLn(hstream: number, val: string): number {
        return this.streams.get(hstream)?.writeLine(val) ?? 0;
    }
    stratum_copyBlock(hstream1: number, hstream2: number, from: number, length: number): NumBool {
        const first = this.streams.get(hstream1);
        if (!first) return 0;
        const second = this.streams.get(hstream2);
        if (!second) return 0;
        return first.copyTo(second, from, length);
    }
    //#endregion

    //#region ФУНКЦИИ УПРАВЛЕНИЯ МАТРИЦАМИ
    stratum_mCreate(q: number, minX: number, maxX: number, minY: number, maxY: number, flag: number): number {
        if (flag <= 0) return 0;

        const rows = maxX - minX + 1;
        const cols = maxY - minY + 1;
        if (rows <= 0 || cols <= 0) return 0;

        const handle = q === 0 ? HandleMap.getFreeNegativeHandle(this.matrices) : q;
        this.matrices.set(handle, new NeoMatrix({ rows, cols, minX, minY }));
        return handle;
    }
    stratum_mDelete(q: number, flag: number): NumBool {
        if (flag <= 0) return 0;
        return this.matrices.delete(q) ? 1 : 0;
    }
    stratum_mFill(q: number, value: number, flag: number): number {
        if (flag <= 0) return 0;
        return this.matrices.get(q)?.fill(value) ?? 0;
    }
    stratum_mGet(q: number, i: number, j: number, flag: number): number {
        if (flag <= 0) return 0;
        return this.matrices.get(q)?.get(i, j) ?? 0;
    }
    stratum_mPut(q: number, i: number, j: number, value: number, flag: number): number {
        if (flag <= 0) return 0;
        return this.matrices.get(q)?.set(i, j, value) ?? 0;
    }
    stratum_async_mEditor(q: number, flag: number): NumBool | Promise<NumBool> {
        if (flag <= 0) return 0;
        throw Error("MEditor: редактор матриц не реализован");
    }
    // stratum_mDiag
    //#endregion

    //#region ФУНКЦИИ УПРАВЛЕНИЯ МАССИВАМИ
    stratum_new(): number {
        const handle = HandleMap.getFreeHandle(this.arrays);
        this.arrays.set(handle, new EnvArray());
        return handle;
    }
    stratum_delete(handle: number): void {
        this.arrays.delete(handle);
    }

    stratum_vGetCount(handle: number): number {
        return this.arrays.get(handle)?.count() ?? 0;
    }
    stratum_vGetType(handle: number, idx: number): string {
        return this.arrays.get(handle)?.type(idx) ?? "";
    }

    stratum_vInsert(handle: number, type: string): NumBool {
        const arr = this.arrays.get(handle);
        if (!arr) return 0;

        const typeUC = type.toUpperCase();

        if (typeUC === "STRING" || typeUC === "FLOAT" || typeUC === "HANDLE") {
            return arr.insert(typeUC);
        }
        const cl = this.classes.get(type);
        if (!cl?.isStruct) return 0;

        const vdata = cl
            .vars()
            .toArray()
            .map<[string, VarType]>((v) => [v.name, v.type]);
        return arr.insertClass(vdata);
    }
    stratum_vDelete(handle: number, idx: number): NumBool {
        return this.arrays.get(handle)?.remove(idx) ?? 0;
    }
    stratum_vClearAll(): NumBool {
        this.arrays.clear();
        return 1;
    }

    stratum_vGetS(handle: number, idx: number, field: string): string {
        return this.arrays.get(handle)?.getString(idx, field) ?? "";
    }
    stratum_vGetH(handle: number, idx: number, field: string): number {
        return this.arrays.get(handle)?.getHandle(idx, field) ?? 0;
    }
    stratum_vGetF(handle: number, idx: number, field: string): number {
        return this.arrays.get(handle)?.getFloat(idx, field) ?? 0;
    }

    stratum_vSet(handle: number, idx: number, field: string, value: string | number): void {
        this.arrays.get(handle)?.set(idx, field, value);
    }

    // FLOAT vSort(HANDLE HArray, [STRING FileldName])
    // FLOAT vSort(HANDLE HArray, FLOAT Decr, [STRING FileldName])
    // FLOAT vSort(HANDLE HArray, [STRING FileldName, FLOAT Decr])
    stratum_vSort(handle: number, ...args: (number | string)[]): NumBool {
        const arr = this.arrays.get(handle);
        if (!arr) return 0;

        if (args.length === 0) {
            return arr.sort();
        }

        if (typeof args[0] === "number") {
            const desc = !!args[0];
            const field = args.length > 1 ? (args[1] as string) : "";
            return arr.sort([{ desc, field }]);
        }

        const algo: EnvArraySortingAlgo[] = [];
        for (let i = 0; i < args.length; i += 2) {
            const field = args[i] as string;
            const desc = !!(args[i + 1] as number);
            algo.push({ desc, field });
        }
        return arr.sort(algo);
    }

    // FLOAT GetVarInfo(STRING ClassName, FLOAT Index, STRING NameVar, STRING TypeVar, STRING Default, STRING Note)
    // FLOAT GetVarInfo(STRING ClassName, FLOAT Index, STRING NameVar, STRING TypeVar, STRING Default, STRING Note, FLOAT Flags)

    // FLOAT GetVarCount(STRING ClassName)

    //     vGetF
    // vGetCount
    // MessageBox
    // SetModelText
    // GetVarCount
    // Delete
    // new
    // GetVarInfo
    // vInsert
    // vSet
    // vSort
    // vGetS
    //#endregion
}
installContextFunctions(Enviroment, "env");
window.addEventListener("pointerdown", Enviroment.handlePointer);
window.addEventListener("pointermove", Enviroment.handlePointer);
window.addEventListener("pointerup", Enviroment.handlePointer);
window.addEventListener("keydown", Enviroment.handleKeyboard);
window.addEventListener("keyup", Enviroment.handleKeyboard);
