import { crefToB, crefToG, crefToR, rgbToCref } from "stratum/common/colorrefParsers";
import { Constant, WM_CHAR } from "stratum/common/constant";
import { EventSubscriber, NumBool } from "stratum/common/types";
import { VarType } from "stratum/common/varType";
import { installContextFunctions } from "stratum/compiler";
import { graphicsImpl } from "stratum/enviroment/toolsAndElementsConstructors";
import {
    createBrushTools,
    createElementOrder,
    createElements,
    createFontTools,
    createImageTools,
    createPenTools,
    createStringTools,
    createTextTools,
    OpenWindowParams,
    parseParameters,
} from "stratum/enviroment/windowAttribs";
import { readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { Hyperbase, VectorDrawing, WindowStyle } from "stratum/fileFormats/vdr";
import { GroupElement2D } from "stratum/graphics/scene/elements/groupElement2d";
import { PrimaryElement, Scene, SceneElement, SceneInputEvent, SceneKeyboardEvent, ScenePointerEvent } from "stratum/graphics/scene/scene";
import { BrushTool, BrushToolArgs } from "stratum/graphics/scene/tools/brushTool";
import { FontTool, FontToolArgs } from "stratum/graphics/scene/tools/fontTool";
import { ImageTool } from "stratum/graphics/scene/tools/imageTool";
import { PenTool } from "stratum/graphics/scene/tools/penTool";
import { StringTool, StringToolArgs } from "stratum/graphics/scene/tools/stringTool";
import { TextTool, TextToolArgs, TextToolPartData } from "stratum/graphics/scene/tools/textTool";
import { SceneWrapper } from "stratum/graphics/sceneWrapper";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { HandleMap } from "stratum/helpers/handleMap";
import { invertMatrix } from "stratum/helpers/invertMatrix";
import { getDirectory } from "stratum/helpers/pathOperations";
import { SuperMap } from "stratum/helpers/superMap";
import { Point2D } from "stratum/helpers/types";
import { MutableArrayLike } from "stratum/helpers/utilityTypes";
import { win1251Table } from "stratum/helpers/win1251";
import { options } from "stratum/options";
import { Project, Schema } from "stratum/project";
import { EnviromentFunctions } from "stratum/project/enviromentFunctions";
import { ProjectArgs } from "stratum/project/project";
import { AddDirInfo, CursorRequestHandler, ErrorHandler, PathInfo, ShellHandler, WindowHost } from "stratum/stratum";
import { EnvArray, EnvArraySortingAlgo } from "./envArray";
import { EnvStream } from "./envStream";
import { FrameController } from "./frameController";
import { LazyLibrary } from "./lazyLibrary";
import { NeoMatrix } from "./neoMatrix";
import { readFile } from "./readFile";

interface EnviromentCaptureTarget {
    scene: Scene;
    receiver: EventSubscriber;
}

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

    private readonly projects: Project[];

    private _shouldQuit: boolean = false;
    private _isWaiting: boolean = false;
    private loading: Promise<void> | null = null;

    private windows = new Map<string, SceneWrapper>();
    private scenes = new Map<number, SceneWrapper>();
    private openedPopups = new Set<SceneWrapper>();
    private streams = new Map<number, EnvStream>();
    private matrices = new Map<number, NeoMatrix>();
    private arrays = new Map<number, EnvArray>();
    private captureTarget: EnviromentCaptureTarget | null = null;

    private classes: LazyLibrary<number>;

    private lastPrimary: number = 0;

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
        this.closeAllWindows();
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
            case "input":
                xArr[xId] = obj.width();
                yArr[yId] = obj.height();
                return 1;
            case "image":
                xArr[xId] = obj.image.tool().width();
                yArr[yId] = obj.image.tool().height();
                return 1;
            case "text":
                xArr[xId] = obj.actualWidth();
                yArr[yId] = obj.actualHeight();
                return 1;
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
        const w = this.windows.get(wname);
        if (!w) {
            xArr[xId] = 0;
            yArr[yId] = 0;
            return 0;
        }
        const [x, y] = w.scene.mouseCoords();
        xArr[xId] = x;
        yArr[yId] = y;
        return 1;
    }

    openSchemeWindow(prj: Project, wname: string, className: string, attrib: string): number {
        const w = this.windows.get(wname);
        if (w) return w.handle;

        const vdr = this.classes.get(className)?.scheme();
        return this.createWindow(prj, wname, parseParameters(attrib, vdr));
    }
    loadSpaceWindow(prj: Project, wname: string, fileName: string, attrib: string): number | Promise<number> {
        const w = this.windows.get(wname);
        if (w) return w.handle;

        if (fileName === "") {
            return this.createWindow(prj, wname, parseParameters(attrib));
        }

        return readFile(prj.dir.resolve(fileName), "vdr")
            .then((vdr) => this.createWindow(prj, wname, parseParameters(attrib, vdr)))
            .catch(() => this.createWindow(prj, wname, parseParameters(attrib)));
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
            const params = parseParameters(attrib, vdr);
            params.position = { x, y };
            params.size = { width: w, height: h };

            if (params.isChild) {
                const parent = this.windows.get(parentWname);
                if (parent) {
                    return this.createWindowFrame(parent, prj, wname, params);
                }
            }
            return this.createWindow(prj, wname, params);
        };

        const vdr = this.classes.get(source)?.scheme();
        if (vdr) return callback(vdr);

        return readFile(prj.dir.resolve(source), "vdr")
            .then((vdr) => callback(vdr))
            .catch(() => callback());
    }
    createDIB2d(dir: PathInfo, hspace: number, fileName: string): number | Promise<number> {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        return readFile(dir.resolve(fileName), "bmp")
            .then((img) => {
                const handle = HandleMap.getFreeHandle(w.dibs);
                w.dibs.set(handle, new graphicsImpl.dib(w.scene, img, { handle }));
                return handle;
            })
            .catch(() => 0);
    }
    createDoubleDib2D(dir: PathInfo, hspace: number, fileName: string): number | Promise<number> {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        return readFile(dir.resolve(fileName), "dbm")
            .then((img) => {
                const handle = HandleMap.getFreeHandle(w.doubleDibs);
                w.dibs.set(handle, new graphicsImpl.dib(w.scene, img, { handle }));
                return handle;
            })
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
        document.body.style.cursor = cursor || "default";
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

    private handlePointer(w: SceneWrapper, evt: ScenePointerEvent): void {
        // https://developer.mozilla.org/ru/docs/Web/API/MouseEvent/buttons#возвращаемые_значения
        const lmb = evt.buttons & 1 ? 1 : 0;
        const rmb = evt.buttons & 2 ? 2 : 0;
        const wheel = evt.buttons & 4 ? 16 : 0;
        const keys = lmb | rmb | wheel;
        const { x: realX, y: realY } = evt;

        let clickElem: SceneElement | null = evt.element;
        while (clickElem) {
            const par = clickElem.parent();
            if (!par) break;
            clickElem = par;
        }

        let subs: SuperMap<EventSubscriber, SceneElement | null>;
        let type: Constant;

        switch (evt.type) {
            case "pointerdown": {
                this.closePopups(w);
                switch (evt.button) {
                    // https://developer.mozilla.org/ru/docs/Web/API/MouseEvent/button#возвращаемые_значения
                    case 0: //Левая кнопка
                        this.handleClick(w.prj, clickElem?.meta, { x: evt.clickX, y: evt.clickY });
                        subs = w.leftButtonDownSubs;
                        type = Constant.WM_LBUTTONDOWN;
                        break;
                    case 1: //Колесико
                        subs = w.middleButtonDownSubs;
                        type = Constant.WM_MBUTTONDOWN;
                        break;
                    case 2: //Правая кнопка
                        subs = w.rightButtonDownSubs;
                        type = Constant.WM_RBUTTONDOWN;
                        break;
                    default:
                        return;
                }
                break;
            }
            case "pointerup": {
                switch (evt.button) {
                    case 0:
                        subs = w.leftButtonUpSubs;
                        type = Constant.WM_LBUTTONUP;
                        break;
                    case 1:
                        subs = w.middleButtonUpSubs;
                        type = Constant.WM_MBUTTONUP;
                        break;
                    case 2:
                        subs = w.rightButtonUpSubs;
                        type = Constant.WM_RBUTTONUP;
                        break;
                    default:
                        return;
                }
                break;
            }
            case "pointermove":
                if (clickElem?.meta) {
                    document.body.style.cursor = "pointer";
                } else {
                    document.body.style.cursor = "default";
                }
                subs = w.mouseMoveSubs;
                type = Constant.WM_MOUSEMOVE;
                break;
        }

        let x = realX;
        let y = realY;
        const mat = w.invMatrix;
        if (mat) {
            const w = realX * mat[2] + realY * mat[5] + mat[8];
            x = (realX * mat[0] + realY * mat[3] + mat[6]) / w;
            y = (realX * mat[1] + realY * mat[4] + mat[7]) / w;
        }
        const capt = this.captureTarget;

        for (const [sub, set] of subs) {
            if ((evt.target === capt?.scene && sub === capt.receiver) || set.has(clickElem) || set.has(null)) {
                sub.receive(type, x, y, keys);
            }
        }
    }

    private handleKeyboard(w: SceneWrapper, evt: SceneKeyboardEvent): void {
        let subs: Set<EventSubscriber>;
        let type: Constant;

        switch (evt.type) {
            case "keydown":
                subs = w.keyDownSubs;
                type = Constant.WM_KEYDOWN;
                break;
            case "keyup":
                subs = w.keyUpSubs;
                type = Constant.WM_KEYUP;
                break;
            case "keychar":
                subs = w.keyCharSubs;
                type = WM_CHAR;
                break;
        }

        subs.forEach((s) => s.receive(type, evt.key, evt.repeat, evt.scan));
    }

    private handleInput(w: SceneWrapper, evt: SceneInputEvent): void {
        const subs = w.controlNotifySubs;
        let type: Constant = Constant.WM_CONTROLNOTIFY;
        let notifyCode: number;
        const targetElem = evt.element;

        switch (evt.type) {
            case "input":
                notifyCode = 768;
                break;
            case "focus":
                notifyCode = 256;
                break;
            case "blur":
                notifyCode = 512;
                break;
        }

        for (const [sub, set] of subs) {
            if (set.has(targetElem) || set.has(null)) {
                sub.receive(type, targetElem.handle, 0, notifyCode);
            }
        }
    }

    setCapture(receiver: EventSubscriber, hspace: number, flags: number): void {
        const scene = this.scenes.get(hspace)?.scene;
        if (!scene) return;
        this.captureTarget = { scene, receiver };
        scene.setCapture();
    }
    subscribe(target: EventSubscriber, wnameOrHspace: string | number, obj2d: number, message: number, flags: number): void {
        const w = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace) : this.windows.get(wnameOrHspace);
        if (!w) return;

        const requireObj = flags & 1;

        const obj = w.objects.get(obj2d) ?? null;
        switch (message) {
            case Constant.WM_MOVE:
                w.windowMoveSubs.add(target);
                break;
            case Constant.WM_SPACEDONE:
                w.spaceDoneSubs.add(target);
                break;
            case Constant.WM_SIZE:
                w.sizeSubs.add(target);
                break;

            case Constant.WM_CONTROLNOTIFY:
                if (obj || obj2d === 0) w.controlNotifySubs.set(target, obj);
                break;

            case Constant.WM_MOUSEMOVE:
                if (obj || !requireObj) w.mouseMoveSubs.set(target, requireObj ? obj : null);
                break;
            case Constant.WM_LBUTTONDOWN:
                if (obj || !requireObj) w.leftButtonDownSubs.set(target, requireObj ? obj : null);
                break;
            case Constant.WM_LBUTTONUP:
                if (obj || !requireObj) w.leftButtonUpSubs.set(target, requireObj ? obj : null);
                break;
            // case EventCode.WM_LBUTTONDBLCLK:
            //     break;
            case Constant.WM_RBUTTONDOWN:
                if (obj || !requireObj) w.rightButtonDownSubs.set(target, requireObj ? obj : null);
                break;
            case Constant.WM_RBUTTONUP:
                if (obj || !requireObj) w.rightButtonUpSubs.set(target, requireObj ? obj : null);
                break;
            // case EventCode.WM_RBUTTONDBLCLK:
            //     break;
            case Constant.WM_MBUTTONDOWN:
                if (obj || !requireObj) w.middleButtonDownSubs.set(target, requireObj ? obj : null);
                break;
            case Constant.WM_MBUTTONUP:
                if (obj || !requireObj) w.middleButtonUpSubs.set(target, requireObj ? obj : null);
                break;
            // case EventCode.WM_MBUTTONDBLCLK:
            //     break;
            case Constant.WM_ALLMOUSEMESSAGE:
                if (!obj && requireObj) break;
                const t = requireObj ? obj : null;
                w.mouseMoveSubs.set(target, t);
                w.leftButtonDownSubs.set(target, t);
                w.leftButtonUpSubs.set(target, t);
                w.rightButtonDownSubs.set(target, t);
                w.rightButtonUpSubs.set(target, t);
                w.middleButtonDownSubs.set(target, t);
                w.middleButtonUpSubs.set(target, t);
                break;
            case Constant.WM_KEYDOWN:
                w.keyDownSubs.add(target);
                break;
            case Constant.WM_KEYUP:
                w.keyUpSubs.add(target);
                break;
            case WM_CHAR:
                w.keyCharSubs.add(target);
                break;
            case Constant.WM_ALLKEYMESSAGE:
                w.keyDownSubs.add(target);
                w.keyUpSubs.add(target);
                w.keyCharSubs.add(target);
                break;
            default:
                console.warn(`Подписка на ${Constant[message]} не реализована (имидж: ${(target as Schema).proto.name})`);
                // this._unsub.add(Constant[code]);
                // if (this._unsub.size > this._unsubS) {
                //     this._unsubS = this._unsub.size;
                //     console.warn(`Подписка на ${Constant[code]} не реализована (имидж: ${})`);
                // }
                break;
        }
    }
    unsubscribe(target: EventSubscriber, wnameOrHspace: string | number, message: number): void {
        const w = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace) : this.windows.get(wnameOrHspace);
        if (!w) return;
        switch (message) {
            case Constant.WM_MOVE:
                w.windowMoveSubs.delete(target);
                break;
            case Constant.WM_SPACEDONE:
                w.spaceDoneSubs.delete(target);
                break;
            case Constant.WM_SIZE:
                w.sizeSubs.delete(target);
                break;

            case Constant.WM_CONTROLNOTIFY:
                w.controlNotifySubs.delete(target);
                break;

            case Constant.WM_MOUSEMOVE:
                w.mouseMoveSubs.delete(target);
                break;
            case Constant.WM_LBUTTONDOWN:
                w.leftButtonDownSubs.delete(target);
                break;
            case Constant.WM_LBUTTONUP:
                w.leftButtonUpSubs.delete(target);
                break;
            // case EventCode.WM_LBUTTONDBLCLK:
            //     break;
            case Constant.WM_RBUTTONDOWN:
                w.rightButtonDownSubs.delete(target);
                break;
            case Constant.WM_RBUTTONUP:
                w.rightButtonUpSubs.delete(target);
                break;
            // case EventCode.WM_RBUTTONDBLCLK:
            //     break;
            case Constant.WM_MBUTTONDOWN:
                w.middleButtonDownSubs.delete(target);
                break;
            case Constant.WM_MBUTTONUP:
                w.middleButtonUpSubs.delete(target);
                break;
            // case EventCode.WM_MBUTTONDBLCLK:
            //     break;
            case Constant.WM_ALLMOUSEMESSAGE:
                w.mouseMoveSubs.delete(target);
                w.leftButtonDownSubs.delete(target);
                w.leftButtonUpSubs.delete(target);
                w.rightButtonDownSubs.delete(target);
                w.rightButtonUpSubs.delete(target);
                w.middleButtonDownSubs.delete(target);
                w.middleButtonUpSubs.delete(target);
                break;
            case Constant.WM_KEYDOWN:
                w.keyDownSubs.delete(target);
                break;
            case Constant.WM_KEYUP:
                w.keyUpSubs.delete(target);
                break;
            case WM_CHAR:
                w.keyCharSubs.delete(target);
                break;
            case Constant.WM_ALLKEYMESSAGE:
                w.keyDownSubs.delete(target);
                w.keyUpSubs.delete(target);
                w.keyCharSubs.delete(target);
                break;
        }
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

    private handleClick(prj: Project, hyp: Hyperbase | null | undefined, point: Point2D): void {
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

                const params = parseParameters("WS_BYSPACE", scheme);
                params.position = point;

                this.createWindow(prj, wname, params);
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

    private createWindow(prj: Project, wname: string, params: OpenWindowParams): number {
        params.title = wname;
        const w = this.createScene(prj, wname, params, (view, opts) => this.host.append(view, opts));
        if (params.isPopup) {
            this.openedPopups.add(w);
        }
        return w.handle;
    }

    private createWindowFrame(parent: SceneWrapper, prj: Project, wname: string, params: OpenWindowParams): number {
        return this.createScene(prj, wname, params, (view, opts) => new FrameController(view as HTMLDivElement, parent.scene, opts)).handle;
    }

    private createScene(prj: Project, wname: string, params: OpenWindowParams, getWindow: WindowHost["append"]): SceneWrapper {
        let scene: Scene;
        let pens: Map<number, PenTool>;
        let brushes: Map<number, BrushTool>;
        let dibs: Map<number, ImageTool>;
        let doubleDibs: Map<number, ImageTool>;
        let fonts: Map<number, FontTool>;
        let strings: Map<number, StringTool>;
        let texts: Map<number, TextTool>;

        let objects: Map<number, SceneElement>;

        const { vdr } = params;

        if (vdr) {
            const p: Point2D = params.sceneOrg ?? vdr.origin;
            scene = new graphicsImpl.scene({
                layers: vdr.layers,
                offsetX: p.x,
                offsetY: p.y,
            });

            pens = createPenTools(scene, vdr.penTools);
            dibs = createImageTools(scene, vdr.dibTools);
            brushes = createBrushTools(scene, dibs, vdr.brushTools);
            doubleDibs = createImageTools(scene, vdr.doubleDibTools);
            fonts = createFontTools(scene, vdr.fontTools);
            strings = createStringTools(scene, vdr.stringTools);
            texts = createTextTools(scene, fonts, strings, vdr.textTools);

            objects = createElements(scene, { pens, brushes, dibs, doubleDibs, texts }, vdr.elements);

            if (vdr.elementOrder) {
                scene.setElements(createElementOrder(vdr.elementOrder, objects));
            }
        } else {
            scene = new graphicsImpl.scene();

            pens = new Map();
            brushes = new Map();
            dibs = new Map();
            doubleDibs = new Map();
            fonts = new Map();
            strings = new Map();
            texts = new Map();

            objects = new Map();
        }

        const wnd = getWindow(scene.view, params);

        const handle = HandleMap.getFreeHandle(this.scenes);

        const m = vdr?.crdSystem?.matrix;
        const wrapper: SceneWrapper = {
            pens,
            brushes,
            objects,
            dibs,
            doubleDibs,
            fonts,
            strings,
            texts,
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
            sizeSubs: new Set(),
            controlNotifySubs: new SuperMap(),
            mouseMoveSubs: new SuperMap(),
            leftButtonUpSubs: new SuperMap(),
            leftButtonDownSubs: new SuperMap(),
            rightButtonUpSubs: new SuperMap(),
            rightButtonDownSubs: new SuperMap(),
            middleButtonUpSubs: new SuperMap(),
            middleButtonDownSubs: new SuperMap(),
            keyDownSubs: new Set(),
            keyUpSubs: new Set(),
            keyCharSubs: new Set(),
            spaceDoneSubs: new Set(),
            windowMoveSubs: new Set(),
        };

        if (wnd.on) {
            wnd.on("closed", () => this.removeWindow(wrapper, false));
        }

        const bindPtr = this.handlePointer.bind(this, wrapper);
        const bindKbd = this.handleKeyboard.bind(this, wrapper);
        const bindInput = this.handleInput.bind(this, wrapper);
        scene
            .on("pointerdown", bindPtr) //преттиер ты достал не формачь это
            .on("pointerup", bindPtr)
            .on("pointermove", bindPtr)
            .on("keydown", bindKbd)
            .on("keyup", bindKbd)
            .on("keychar", bindKbd)
            .on("inputState", bindInput);

        this.windows.set(wname, wrapper);
        this.scenes.set(handle, wrapper);
        return wrapper;
    }

    private removeWindow(w: SceneWrapper, close: boolean): void {
        this.windows.delete(w.wname);
        this.scenes.delete(w.handle);
        this.openedPopups.delete(w);
        if (w.scene === this.captureTarget?.scene) {
            this.captureTarget.scene.releaseCapture();
            this.captureTarget = null;
        }
        w.wnd.off && w.wnd.off("closed");
        close && w.wnd.close && w.wnd.close();
        w.spaceDoneSubs.forEach((h) => h.receive(Constant.WM_SPACEDONE));
    }

    private closeAllWindows(): void {
        this.windows.forEach((w) => this.removeWindow(w, true));
    }

    private closeProjectWindows(prj: Project): void {
        this.windows.forEach((w) => {
            if (w.prj === prj) this.removeWindow(w, true);
        });
    }

    private closePopups(except: SceneWrapper): void {
        this.openedPopups.forEach((w) => {
            if (w !== except) this.removeWindow(w, true);
        });
    }

    // Реализации функций.
    stratum_releaseCapture(): void {
        this.captureTarget?.scene.releaseCapture();
        this.captureTarget = null;
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
        this.handlers.shell.forEach((h) => h(path, args, directory, flag));
        return 1;
    }

    // Клавиатура
    stratum_getAsyncKeyState(vkey: number): number {
        if (vkey < 0 || vkey > Scene.keyState.length - 1) return 0;
        return Scene.keyState[vkey] > 0 ? 1 : 0;
    }

    // Время
    stratum_getTickCount(): number {
        return new Date().getTime() - Enviroment.startupTime;
    }

    // Гиперпереход
    stratum_setHyperJump2d(hspace: number, hobject: number, mode: number, ...args: string[]): NumBool {
        if (mode < -1 || mode > 4) return 0;

        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        if (mode === -1) {
            obj.meta = null;
            return 1;
        }
        const hyp: Hyperbase = {
            openMode: mode,
            target: args[0],
            objectName: args[1],
            effect: args[2],
            windowName: args[3],
            params: args[4],
        };
        obj.meta = hyp;
        return 1;
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
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return;

        const obj = wrapper.objects.get(hobject) ?? this.getObjAtPoint(wrapper, x, y, false);

        let clickX = x;
        let clickY = y;

        const mat = wrapper.matrix;
        if (mat) {
            const w = x * mat[2] + y * mat[5] + mat[8];
            clickX = (x * mat[0] + y * mat[3] + mat[6]) / w;
            clickY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }

        clickX -= wrapper.scene.offsetX();
        clickY -= wrapper.scene.offsetY();

        this.handleClick(wrapper.prj, obj?.meta, { x: clickX, y: clickY });
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
        const w = this.windows.get(wname);
        if (!w) return 0;
        this.removeWindow(w, true);
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
        w.scene.brush.setTool(w.brushes.get(hBrush) ?? null);
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
                return w.dibs.get(toolHandle)?.subCount() ?? 0;
            case Constant.DOUBLEDIB2D:
                return w.doubleDibs.get(toolHandle)?.subCount() ?? 0;
            case Constant.TEXT2D:
                return w.texts.get(toolHandle)?.subCount() ?? 0;
            case Constant.STRING2D:
                return w.strings.get(toolHandle)?.subCount() ?? 0;
            case Constant.FONT2D:
                return w.fonts.get(toolHandle)?.subCount() ?? 0;
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
            case Constant.BRUSH2D: {
                const b = w.brushes.get(toolHandle);
                if (!b) return 0;
                b.image.forceUnsub();
                w.brushes.delete(toolHandle);
                return 1;
            }
            case Constant.DIB2D:
                return w.dibs.delete(toolHandle) ? 1 : 0;
            case Constant.DOUBLEDIB2D:
                return w.doubleDibs.delete(toolHandle) ? 1 : 0;
            case Constant.TEXT2D:
                const t = w.texts.get(toolHandle);
                if (!t) return 0;
                t.parts.forEach((t) => {
                    t.font.forceUnsub();
                    t.str.forceUnsub();
                });
                w.texts.delete(toolHandle);
                return 1;
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
        w.pens.set(handle, new graphicsImpl.pen(w.scene, { handle, color, rop: rop2, style, width }));
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
    stratum_createBrush2d(hspace: number, style: number, hatch: number, color: number, hdib: number, type: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const handle = HandleMap.getFreeHandle(w.brushes);

        const args: BrushToolArgs = {
            handle,
            color,
            hatch,
            style,
            rop: type,
            image: w.dibs.get(hdib),
        };

        w.brushes.set(handle, new graphicsImpl.brush(w.scene, args));
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
        return this.scenes.get(hspace)?.brushes.get(hbrush)?.image.tool()?.handle ?? 0;
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
    stratum_setBrushDib2d(hspace: number, hbrush: number, hdib: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const b = w.brushes.get(hbrush);
        if (!b) return 0;
        b.image.setTool(w.dibs.get(hdib) ?? null);
        return 1;
    }

    private createFont(hspace: number, name: string, height: number, style: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const handle = HandleMap.getFreeHandle(w.fonts);
        const args: FontToolArgs = { handle, name, style };
        w.fonts.set(handle, new graphicsImpl.font(w.scene, height, args));
        return handle;
    }

    // Инструмент Шрифт
    //
    stratum_createFont2D(hspace: number, fontName: string, height: number, flags: number): number {
        return this.createFont(hspace, fontName, height, flags);
    }
    private static readonly pxToPt = 0.752812499999996;
    private static readonly ptToPx = 1.338307;
    stratum_createFont2Dpt(hspace: number, fontName: string, size: number, flags: number): number {
        return this.createFont(hspace, fontName, size * Enviroment.ptToPx, flags);
    }

    stratum_getFontName2d(hspace: number, hfont: number): string {
        return this.scenes.get(hspace)?.fonts.get(hfont)?.name() ?? "";
    }
    stratum_getFontSize2d(hspace: number, hfont: number): number {
        return (this.scenes.get(hspace)?.fonts.get(hfont)?.size() ?? 0) * Enviroment.pxToPt;
    }
    stratum_getFontStyle2d(hspace: number, hfont: number): number {
        return this.scenes.get(hspace)?.fonts.get(hfont)?.style() ?? 0;
    }

    stratum_setFontName2d(hspace: number, hfont: number, fontName: string): NumBool {
        const f = this.scenes.get(hspace)?.fonts.get(hfont);
        if (!f) return 0;
        f.setName(fontName);
        return 1;
    }
    stratum_setFontSize2d(hspace: number, hfont: number, size: number): NumBool {
        const f = this.scenes.get(hspace)?.fonts.get(hfont);
        if (!f) return 0;
        f.setSize(size * Enviroment.ptToPx);
        return 1;
    }
    stratum_setFontStyle2d(hspace: number, hfont: number, flags: number): NumBool {
        const f = this.scenes.get(hspace)?.fonts.get(hfont);
        if (!f) return 0;
        f.setStyle(flags);
        return 1;
    }

    // Инструмент Строка
    //
    stratum_createString2D(hspace: number, value: string): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;
        const handle = HandleMap.getFreeHandle(w.strings);
        const args: StringToolArgs = { handle };
        w.strings.set(handle, new graphicsImpl.str(w.scene, value, args));
        return handle;
    }
    stratum_getstring2d(hspace: number, hstring: number): string {
        return this.scenes.get(hspace)?.strings.get(hstring)?.text() ?? "";
    }
    stratum_setString2d(hspace: number, hstring: number, value: string): NumBool {
        const s = this.scenes.get(hspace)?.strings.get(hstring);
        if (!s) return 0;
        s.setText(value);
        return 1;
    }

    // Инструмент Текст
    //
    stratum_createText2D(hspace: number, hfont: number, hstring: number, fgColor: number, bgColor: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const font = w.fonts.get(hfont);
        if (!font) return 0;
        const str = w.strings.get(hstring);
        if (!str) return 0;

        const part: TextToolPartData = {
            fgColor,
            bgColor,
            font,
            str,
        };

        const handle = HandleMap.getFreeHandle(w.texts);
        const args: TextToolArgs = { handle };
        w.texts.set(handle, new graphicsImpl.ttool(w.scene, [part], args));
        return handle;
    }
    stratum_createRasterText2D(hspace: number, htext: number, x: number, y: number, angle: number): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const tool = w.texts.get(htext);
        if (!tool) return 0;

        let realX = x;
        let realY = y;

        const mat = w.matrix;
        if (mat) {
            const w = x * mat[2] + y * mat[5] + mat[8];
            realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
            realY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }

        const handle = HandleMap.getFreeHandle(w.objects);
        const text = new graphicsImpl.text(w.scene, tool, { handle, x: realX, y: realY, angle });
        w.objects.set(handle, text);
        w.scene.setElements([...w.scene.elements(), text]);
        return handle;
    }

    stratum_getTextObject2d(hspace: number, hobject: number): number {
        const text = this.scenes.get(hspace)?.objects.get(hobject);
        return text?.type === "text" ? text.tool.tool()?.handle ?? 0 : 0;
    }
    stratum_getTextCount2d(hspace: number, htext: number): number {
        return this.scenes.get(hspace)?.texts.get(htext)?.parts.length ?? 0;
    }

    stratum_getTextFont2d(hspace: number, htext: number, index: number = 0): number {
        if (index < 0) return 0;
        const parts = this.scenes.get(hspace)?.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;
        return parts[index].font.tool().handle;
    }
    stratum_getTextString2d(hspace: number, htext: number, index: number = 0): number {
        if (index < 0) return 0;
        const parts = this.scenes.get(hspace)?.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;
        return parts[index].str.tool().handle;
    }
    stratum_getTextFgColor2d(hspace: number, htext: number, index: number = 0): number {
        if (index < 0) return 0;
        const parts = this.scenes.get(hspace)?.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;
        return parts[index].fgColor();
    }
    stratum_getTextBkColor2d(hspace: number, htext: number, index: number = 0): number {
        if (index < 0) return 0;
        const parts = this.scenes.get(hspace)?.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;
        return parts[index].bgColor();
    }

    stratum_setText2D(hspace: number, htext: number, /*          */ hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    stratum_setText2D(hspace: number, htext: number, index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    stratum_setText2D(hspace: number, htext: number, a1: number, a2: number, a3: number, a4: number, a5?: number): NumBool {
        const index = typeof a5 !== "undefined" ? a1 : 0;
        const hfont = typeof a5 !== "undefined" ? a2 : a1;
        const hstring = typeof a5 !== "undefined" ? a3 : a2;
        const fgColor = typeof a5 !== "undefined" ? a4 : a3;
        const bgColor = typeof a5 !== "undefined" ? a5 : a4;

        if (index < 0) return 0;

        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const parts = w.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;

        const p = parts[index].setFgColor(fgColor).setBgColor(bgColor);

        const font = w.fonts.get(hfont);
        if (font) p.font.setTool(font);

        const str = w.strings.get(hstring);
        if (str) p.str.setTool(str);

        return 1;
    }

    stratum_setTextFgColor2d(hspace: number, htext: number, index: number, fgColor: number): NumBool {
        if (index < 0) return 0;
        const parts = this.scenes.get(hspace)?.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;
        parts[index].setFgColor(fgColor);
        return 1;
    }
    stratum_setTextBkColor2d(hspace: number, htext: number, index: number, bgColor: number): NumBool {
        if (index < 0) return 0;
        const parts = this.scenes.get(hspace)?.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;
        parts[index].setBgColor(bgColor);
        return 1;
    }
    stratum_setTextFont2d(hspace: number, htext: number, index: number, hfont: number): NumBool {
        if (index < 0) return 0;

        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const font = w.fonts.get(hfont);
        if (!font) return 0;

        const parts = w.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;

        parts[index].font.setTool(font);
        return 1;
    }
    stratum_setTextString2d(hspace: number, htext: number, index: number, hstring: number): NumBool {
        if (index < 0) return 0;

        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const str = w.strings.get(hstring);
        if (!str) return 0;

        const parts = w.texts.get(htext)?.parts;
        if (!parts || index > parts.length - 1) return 0;

        parts[index].str.setTool(str);
        return 1;
    }

    // Инструмент Битовая карта
    //

    stratum_getDibPixel2D(hspace: number, hdib: number, x: number, y: number): number {
        return this.scenes.get(hspace)?.dibs.get(hdib)?.pixel(x, y) ?? 0;
    }
    stratum_setDibPixel2D(hspace: number, hdib: number, x: number, y: number, colorref: number): number {
        const d = this.scenes.get(hspace)?.dibs.get(hdib);
        if (!d) return 0;
        d.setPixel(x, y, colorref);
        return 1;
    }

    // Двойная битовая карта
    //

    private createBitmap(hspace: number, hdib: number, x: number, y: number, isTransparent: boolean): number {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const tool = (isTransparent ? w.doubleDibs : w.dibs).get(hdib);
        if (!tool) return 0;

        let realX = x;
        let realY = y;

        const mat = w.matrix;
        if (mat) {
            const w = x * mat[2] + y * mat[5] + mat[8];
            realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
            realY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }

        const handle = HandleMap.getFreeHandle(w.objects);
        const bmp = new graphicsImpl.bitmap(w.scene, isTransparent, tool, { handle, x: realX, y: realY });
        w.objects.set(handle, bmp);
        w.scene.setElements([...w.scene.elements(), bmp]);
        return handle;
    }

    // Объект Битмап
    //
    stratum_createBitmap2d(hspace: number, hdib: number, x: number, y: number): number {
        return this.createBitmap(hspace, hdib, x, y, false);
    }
    stratum_createDoubleBitmap2D(hspace: number, hdib: number, x: number, y: number): number {
        return this.createBitmap(hspace, hdib, x, y, true);
    }

    stratum_setBitmapSrcRect2d(hspace: number, hobject: number, x: number, y: number, width: number, height: number): number {
        const bmp = this.scenes.get(hspace)?.objects.get(hobject);
        if (bmp?.type !== "image") return 0;
        bmp.setCropArea({ x, y, w: width, h: height });
        return 1;
    }

    stratum_getDibObject2d(hspace: number, hobject: number): number {
        const bmp = this.scenes.get(hspace)?.objects.get(hobject);
        return bmp?.type === "image" && !bmp.isTransparent ? bmp.image.tool().handle : 0;
    }
    stratum_getDDibObject2d(hspace: number, hobject: number): number {
        const bmp = this.scenes.get(hspace)?.objects.get(hobject);
        return bmp?.type === "image" && bmp.isTransparent ? bmp.image.tool().handle : 0;
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
                obj.pen.forceUnsub();
                obj.brush.forceUnsub();
                break;
            case "image":
                obj.image.forceUnsub();
                break;
            case "text":
                obj.tool.forceUnsub();
                break;
            case "input":
                obj.font.forceUnsub();
                break;
            default:
                const never: never = obj;
                throw Error(`Неизвестный тип ${never["type"]}`);
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
            case "image":
                return obj.isTransparent ? Constant.OTDOUBLEBITMAP_2D : Constant.OTBITMAP_2D;
            case "text":
                return Constant.OTTEXT_2D;
            case "input":
                return 26; //Я хз, вроде бы проверял в стратуме - возвращает такое число.
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
    stratum_getActualWidth2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
            case "line":
            case "input":
                return obj.width();
            case "image":
                return obj.image.tool().width();
            case "text":
                return obj.actualWidth();
        }
    }
    stratum_getActualHeight2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
            case "line":
            case "input":
                return obj.height();
            case "image":
                return obj.image.tool().height();
            case "text":
                return obj.actualHeight();
        }
    }

    stratum_getObjectAngle2d(hspace: number, hobject: number): number {
        const obj = this.scenes.get(hspace)?.objects.get(hobject);
        if (!obj) return 0;
        switch (obj.type) {
            case "group":
            case "line":
            case "input":
            case "image":
                return 0;
            case "text":
                return obj.angle();
        }
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

    private getObjAtPoint(wrapper: SceneWrapper, x: number, y: number, savePrimary: boolean): SceneElement | null {
        let newX = x;
        let newY = y;
        const mat = wrapper.matrix;
        if (mat) {
            const w = x * mat[2] + y * mat[5] + mat[8];
            newX = (x * mat[0] + y * mat[3] + mat[6]) / w;
            newY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }

        const obj = wrapper.scene.elementAtPoint(newX, newY);
        if (savePrimary) this.lastPrimary = obj?.handle ?? 0;
        if (!obj) return null;

        let res: SceneElement = obj;
        while (res) {
            const par = res.parent();
            if (!par) break;
            res = par;
        }
        return res;
    }

    stratum_getObjectFromPoint2d(hspace: number, x: number, y: number): number {
        const wrapper = this.scenes.get(hspace);
        if (!wrapper) return 0;

        return this.getObjAtPoint(wrapper, x, y, true)?.handle ?? 0;
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

        let realCoords = coordinates;

        const mat = w.matrix;
        if (mat) {
            const coords = coordinates.slice();
            for (let i = 0; i < realCoords.length; i += 2) {
                const x = realCoords[i];
                const y = realCoords[i + 1];
                const w = x * mat[2] + y * mat[5] + mat[8];
                coords[i] = (x * mat[0] + y * mat[3] + mat[6]) / w;
                coords[i + 1] = (x * mat[1] + y * mat[4] + mat[7]) / w;
            }
            realCoords = coords;
        }

        const pen = w.pens.get(hpen);
        const brush = w.brushes.get(hbrush);

        const handle = HandleMap.getFreeHandle(w.objects);
        const line = new graphicsImpl.line(w.scene, realCoords, { handle, pen, brush });
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
        const inputType = className.toUpperCase();
        if (inputType !== "EDIT" && inputType !== "BUTTON" && inputType !== "COMBOBOX") {
            return 0;
        }

        const w = this.scenes.get(hspace);
        if (!w) return 0;

        let realX = x;
        let realY = y;

        const mat = w.matrix;
        if (mat) {
            const w = x * mat[2] + y * mat[5] + mat[8];
            realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
            realY = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }

        // WIP: добавить другие типы контролов.
        if (inputType !== "EDIT") throw Error(`Элемент ввода ${inputType} не реализован.`);

        const handle = HandleMap.getFreeHandle(w.objects);
        const input = new graphicsImpl.input(w.scene, { handle, x: realX, y: realY, text, width, height });
        w.objects.set(handle, input);
        w.scene.setElements([...w.scene.elements(), input]);
        return handle;
    }

    stratum_setControlFont2d(hspace: number, hobject: number, hfont: number): NumBool {
        const w = this.scenes.get(hspace);
        if (!w) return 0;

        const font = w.fonts.get(hfont);
        if (!font) return 0;

        const input = w.objects.get(hobject);
        // WIP: добавить для других типов контролов.
        if (input?.type !== "input") return 0;

        input.font.setTool(font);
        return 1;
    }

    stratum_getControlText2d(hspace: number, hcontrol: number, begin?: number, length?: number): string {
        const input = this.scenes.get(hspace)?.objects.get(hcontrol);
        // WIP: добавить для других типов контролов.
        if (input?.type !== "input") return "";

        if (typeof begin === "undefined" || typeof length === "undefined") return input.text();
        return input.text().slice(begin, begin + length);
    }
    stratum_setControlText2d(hspace: number, hcontrol: number, text: string): NumBool {
        const input = this.scenes.get(hspace)?.objects.get(hcontrol);
        // WIP: добавить для других типов контролов.
        if (input?.type !== "input") return 0;
        input.setText(text);
        return 1;
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
