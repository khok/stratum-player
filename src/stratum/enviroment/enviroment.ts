import { crefToB, crefToG, crefToR, rgbToCref } from "stratum/common/colorrefParsers";
import { Constant } from "stratum/common/constant";
import { EventSubscriber, NumBool } from "stratum/common/types";
import { installContextFunctions } from "stratum/compiler";
import { readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { Hyperbase, VectorDrawing, WindowStyle } from "stratum/fileFormats/vdr";
import { Scene } from "stratum/graphics/scene";
import { SceneWindow, WindowArgs, WindowRect } from "stratum/graphics/sceneWindow";
import { parseWindowAttribs, WindowAttribs } from "stratum/graphics/windowAttribs";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { HandleMap } from "stratum/helpers/handleMap";
import { getDirectory } from "stratum/helpers/pathOperations";
import { Point2D } from "stratum/helpers/types";
import { MutableArrayLike } from "stratum/helpers/utilityTypes";
import { win1251Table } from "stratum/helpers/win1251";
import { options } from "stratum/options";
import { Project } from "stratum/project";
import { EnviromentFunctions } from "stratum/project/enviromentFunctions";
import { ProjectArgs } from "stratum/project/project";
import { AddDirInfo, PathInfo, WindowHost } from "stratum/stratum";
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
        const [prjBuf, sttBuf] = await workDir.fs.arraybuffers([prjFile, sttFile]);
        if (!prjBuf) throw Error(`Файл проекта ${prjFile} не найден`);
        options.log(`Открываем проект ${prjFile.toString()}`);

        // Файл проекта.
        const prjInfo = readPrjFile(new BinaryReader(prjBuf, prjFile.toString()));

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
        await classes.add(workDir.fs, dirs, true, args.id);
        return { classes: classes, dir: workDir, prjInfo, stt };
    }

    private readonly projects: Project[];

    private _shouldQuit: boolean = false;
    private _isWaiting: boolean = false;
    private loading: Promise<void> | null = null;

    private windows = new Map<string, SceneWindow<Project>>();
    private scenes = new Map<number, Scene>();
    private streams = new Map<number, EnvStream>();
    private matrices = new Map<number, NeoMatrix>();
    private arrays = new Map<number, EnvArray>();
    private targetScene: Scene | null = null;

    private classes: LazyLibrary<number>;
    private host: WindowHost;

    constructor(args: ProjectResources, host: WindowHost) {
        this.projects = [new Project(this, args)];
        this.classes = args.classes;
        this.host = host;
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
            options.log(`Закрывается проект ${prj.dir.toString()}`);
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
        this.windows.forEach((w) => w.close());
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
            options.log(`Закрывается проект ${prj.dir.toString()}`);
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
        const obj = this.getObject(hspace, hobject);
        if (typeof obj === "undefined") {
            xArr[xId] = 0;
            yArr[yId] = 0;
            return 0;
        }
        xArr[xId] = obj.actualWidth();
        yArr[yId] = obj.actualHeight();
        return 1;
    }

    openSchemeWindow(prj: Project, wname: string, className: string, attrib: string): number {
        const wnd = this.windows.get(wname);
        if (typeof wnd !== "undefined") return wnd.sceneHandle;

        const vdr = this.classes.get(className)?.scheme();
        return this.openWindow(prj, wname, parseWindowAttribs(attrib), vdr);
    }
    loadSpaceWindow(prj: Project, wname: string, fileName: string, attrib: string): number | Promise<number> {
        const wnd = this.windows.get(wname);
        if (typeof wnd !== "undefined") return wnd.sceneHandle;

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
        const wnd = this.windows.get(wname);
        if (typeof wnd !== "undefined") return wnd.sceneHandle;

        const callback = (vdr?: VectorDrawing | null): number => {
            const parent = this.windows.get(parentWname);
            const attribs = parseWindowAttribs(attrib);
            const rect: WindowRect = { x, y, w, h };
            if (!parent || !attribs.child) {
                return this.openWindow(prj, wname, attribs, vdr, rect);
            }
            return this.openSubwindow(parent, prj, wname, rect, vdr);
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
        const scene = this.scenes.get(hspace);
        if (typeof scene !== "undefined") (this.targetScene = scene).setCapture(target);
    }
    subscribe(target: EventSubscriber, wnameOrHspace: string | number, obj2d: number, message: number, flags: number): void {
        const wnd = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace)?.wnd : this.windows.get(wnameOrHspace);
        wnd?.on(target, message, flags & 1 ? obj2d : 0);
    }
    unsubscribe(target: EventSubscriber, wnameOrHspace: string | number, message: number): void {
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
        const handle = HandleMap.getFreeHandle(this.scenes);
        const args: WindowArgs = {
            handle,
            wname,
            vdr,
            attribs,
            rect,
            onClosed: () => this.removeWindow(wname),
        };
        const wnd = new SceneWindow<Project>(args, (view, opts) => {
            if (opts.popup) this.lastOpenPopup = wname;
            return this.host.window(view, opts);
        });

        this.windows.set(wname, wnd);
        this.scenes.set(handle, wnd.scene);
        wnd.projectID = prj;
        wnd.scene.hyperHandler = prj;
        return handle;
    }

    private openSubwindow(parent: SceneWindow<Project>, prj: Project, wname: string, rect: WindowRect, vdr?: VectorDrawing | null): number {
        const handle = HandleMap.getFreeHandle(this.scenes);
        const wnd = parent.subwindow({
            handle,
            wname,
            vdr,
            rect,
            onClosed: () => this.removeWindow(wname),
        });

        this.windows.set(wname, wnd);
        this.scenes.set(handle, wnd.scene);
        wnd.projectID = prj;
        wnd.scene.hyperHandler = prj;
        return handle;
    }

    private closeProjectWindows(prj: Project) {
        for (const w of this.windows.values()) {
            if (w.projectID === prj) w.close();
        }
    }

    private removeWindow(wname: string): void {
        const wnd = this.windows.get(wname);
        if (!wnd) return;

        this.windows.delete(wname);
        this.scenes.delete(wnd.sceneHandle);
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

    private getObject(hspace: number, hobject: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.objects.get(hobject) : undefined;
    }
    private getTPen(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.pens.get(htool) : undefined;
    }
    private getTBrush(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.brushes.get(htool) : undefined;
    }
    private getTDIB(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.dibs.get(htool) : undefined;
    }
    private getTText(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.texts.get(htool) : undefined;
    }
    private getTString(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.strings.get(htool) : undefined;
    }
    private getTFont(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.fonts.get(htool) : undefined;
    }

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

    stratum_setObjectAttribute2d(hspace: number, hobject: number, attr: number, flag: number): NumBool {
        return 1;
    }
    //#endregion

    //#region ФУНКЦИИ СИСТЕМНЫЕ
    stratum_system(command: number, ...params: number[]): number {
        // console.warn(`Вызов System(${command}, ${params})`);
        return 0;
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

    // Лог
    stratum_logMessage(msg: string): void {
        options.log("Инфо: " + msg);
    }
    //#endregion

    //#region ФУНКЦИИ ОКОН
    stratum_getClientHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.clientHeight() : 0;
    }
    stratum_getClientWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.clientWidth() : 0;
    }
    stratum_getWindowName(hspace: number): string {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.wnd.name : "";
    }
    stratum_getWindowOrgX(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.originX() : 0;
    }
    stratum_getWindowOrgY(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.originY() : 0;
    }
    stratum_getWindowSpace(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.sceneHandle : 0;
    }
    stratum_getWindowWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.width() : 0;
    }
    stratum_getWindowHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.height() : 0;
    }
    stratum_getWindowTitle(wname: string): string {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.title() : "";
    }

    stratum_setClientSize(wname: string, width: number, height: number): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.setClientSize(width, height) : 0;
    }
    stratum_setWindowOrg(wname: string, orgX: number, orgY: number): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.setOrigin(orgX, orgY) : 0;
    }
    stratum_setWindowTitle(wname: string, title: string): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.setTitle(title) : 0;
    }

    stratum_getWindowProp(wname: string, prop: string): string {
        const src = this.windows.get(wname)?.source;
        if (!src) return "";

        const propUC = prop.toUpperCase();
        const useProp = (propUC === "CLASSNAME" && src.origin === "class") || (propUC === "FILENAME" && src.origin === "file");
        return useProp ? src.name : "";
    }
    stratum_isWindowExist(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? 1 : 0;
    }
    stratum_bringWindowToTop(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.toTop() : 0;
    }
    stratum_showWindow(wname: string, flag: number): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.setAttrib(flag) : 0;
    }
    stratum_closeWindow(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.close() : 0;
    }
    stratum_setWindowTransparent(wname: string, level: number): NumBool;
    stratum_setWindowTransparent(hspace: number, level: number): NumBool;
    stratum_setWindowTransparent(wnameOrHspace: number | string, level: number): NumBool {
        const wnd = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace)?.wnd : this.windows.get(wnameOrHspace);
        return wnd?.setTransparent(level) ?? 0;
    }
    stratum_setWindowTransparentColor(wname: string, cref: number): NumBool;
    stratum_setWindowTransparentColor(hspace: number, cref: number): NumBool;
    stratum_setWindowTransparentColor(wnameOrHspace: number | string, cref: number): NumBool {
        const wnd = typeof wnameOrHspace === "number" ? this.scenes.get(wnameOrHspace)?.wnd : this.windows.get(wnameOrHspace);
        return wnd?.setTransparentColor(cref) ?? 0;
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
    stratum_getSpaceOrg2dx(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.originX() : 0;
    }
    stratum_getSpaceOrg2dy(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.originY() : 0;
    }
    stratum_setSpaceOrg2d(hspace: number, x: number, y: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setOrigin(x, y) : 0;
    }
    stratum_getScaleSpace2d(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.scale() : 0;
    }
    stratum_setScaleSpace2d(hspace: number, ms: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setScale(ms) : 0;
    }
    // stratum_emptySpace2d(hspace: number): NumBool {
    //     const scene = this.scenes.get(hspace);
    //     return typeof scene !== "undefined" ? scene.clear() : 0;
    // }
    stratum_getBkBrush2d(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.brushHandle() : 0;
    }
    stratum_setBkBrush2d(hspace: number, hBrush: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setBrush(hBrush) : 0;
    }

    private lockSpace2dWarnShowed = false;
    stratum_lockSpace2d(hspace: number, lock: number): number {
        if (!this.lockSpace2dWarnShowed) {
            console.warn(`LockSpace2d(${hspace}, ${lock}) игнорируется`);
            this.lockSpace2dWarnShowed = true;
        }
        return 0;
    }

    // Инструмент Карандаш
    //
    stratum_createPen2d(hspace: number, style: number, width: number, color: number, rop2: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createPenTool(style, width, color, rop2) : 0;
    }

    stratum_getPenColor2d(hspace: number, hpen: number): number {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.color() : 0;
    }
    stratum_getPenRop2d(hspace: number, hpen: number): number {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.rop() : 0;
    }
    stratum_getPenStyle2d(hspace: number, hpen: number): number {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.style() : 0;
    }
    stratum_getPenWidth2d(hspace: number, hpen: number): number {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.width() : 0;
    }

    stratum_setPenColor2d(hspace: number, hpen: number, color: number): NumBool {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.setColor(color) : 0;
    }
    stratum_setPenRop2d(hspace: number, hpen: number, rop: number): NumBool {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.setRop(rop) : 0;
    }
    stratum_setPenStyle2d(hspace: number, hpen: number, style: number): NumBool {
        const o = this.getTPen(hspace, hpen);
        return typeof o !== "undefined" ? o.setStyle(style) : 0;
    }
    stratum_setPenWidth2d(hspace: number, hpen: number, width: number): NumBool {
        const p = this.getTPen(hspace, hpen);
        return typeof p !== "undefined" ? p.setWidth(width) : 0;
    }

    // Инструмент Кисть
    //
    stratum_createBrush2d(hspace: number, style: number, hatch: number, color: number, hdib: number, type: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createBrushTool(style, hatch, color, hdib, type) : 0;
    }

    stratum_getBrushColor2d(hspace: number, hbrush: number): number {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.color() : 0;
    }
    stratum_getBrushRop2d(hspace: number, hbrush: number): number {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.rop() : 0;
    }
    stratum_getBrushStyle2d(hspace: number, hbrush: number): number {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.style() : 0;
    }
    stratum_getBrushHatch2d(hspace: number, hbrush: number): number {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.hatch() : 0;
    }
    stratum_getBrushDib2d(hspace: number, hbrush: number): number {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.dibHandle() : 0;
    }

    stratum_setBrushColor2d(hspace: number, hbrush: number, color: number): NumBool {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.setColor(color) : 0;
    }
    stratum_setBrushRop2d(hspace: number, hbrush: number, rop: number): NumBool {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.setRop(rop) : 0;
    }
    stratum_setBrushStyle2d(hspace: number, hbrush: number, style: number): NumBool {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.setStyle(style) : 0;
    }
    stratum_setBrushHatch2d(hspace: number, hbrush: number, hatch: number): NumBool {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.setHatch(hatch) : 0;
    }
    stratum_setBrushDib2d(hspace: number, hbrush: number, hdib: number): NumBool {
        const b = this.getTBrush(hspace, hbrush);
        return typeof b !== "undefined" ? b.setDIB(hdib) : 0;
    }

    // Инструмент Шрифт
    //
    stratum_createFont2D(hspace: number, fontName: string, height: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createFontTool(fontName, height, flags) : 0;
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
    stratum_deleteObject2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.deleteObject(hobject) : 0;
    }

    stratum_getObjectName2d(hspace: number, hobject: number): string {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.objectName(hobject) : "";
    }
    stratum_setObjectName2d(hspace: number, hobject: number, name: string): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setObjectName(hobject, name) : 0;
    }
    stratum_getObject2dByName(hspace: number, hgroup: number, name: string): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.getObject2dByName(hgroup, name) : 0;
    }

    stratum_setObjectOrg2d(hspace: number, hobject: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setOrigin(x, y) : 0;
    }
    stratum_getObjectOrg2dx(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.originX() : 0;
    }
    stratum_getObjectOrg2dy(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.originY() : 0;
    }

    stratum_setObjectSize2d(hspace: number, hobject: number, sizeX: number, sizeY: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setSize(sizeX, sizeY) : 0;
    }
    stratum_getObjectWidth2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.width() : 0;
    }
    stratum_getObjectHeight2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.height() : 0;
    }
    stratum_getActualHeight2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.actualHeight() : 0;
    }
    stratum_getActualWidth2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.actualWidth() : 0;
    }

    stratum_getObjectAngle2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.angle() : 0;
    }
    stratum_rotateObject2d(hspace: number, hobject: number, centerX: number, centerY: number, angle: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.rotate(centerX, centerY, angle) : 0;
    }

    stratum_setShowObject2d(hspace: number, hobject: number, visible: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setVisibility(visible !== 0) : 0;
    }
    stratum_showObject2d(hspace: number, hobject: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setVisibility(true) : 0;
    }
    stratum_hideObject2d(hspace: number, hobject: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setVisibility(false) : 0;
    }

    stratum_getObjectFromPoint2d(hspace: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.getObjectFromPoint2d(x, y) : 0;
    }

    // Функции для управления Z-порядком графических объектов
    //
    stratum_getBottomObject2d(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.bottomObjectHandle() : 0;
    }
    stratum_getUpperObject2d(hspace: number, hobject: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.upperObjectHandle(hobject) : 0;
    }
    stratum_getObjectFromZOrder2d(hspace: number, zOrder: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.objectFromZOrder(zOrder) : 0;
    }
    stratum_getLowerObject2d(hspace: number, hobject: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.lowerObjectHandle(hobject) : 0;
    }
    stratum_getTopObject2d(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.topObjectHandle() : 0;
    }
    stratum_getZOrder2d(hspace: number, hobject: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.objectZOrder(hobject) : 0;
    }
    stratum_objectToBottom2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.objectToBottom(hobject) : 0;
    }
    stratum_objectToTop2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.objectToTop(hobject) : 0;
    }
    stratum_setZOrder2d(hspace: number, hobject: number, zOrder: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setObjectZOrder(hobject, zOrder) : 0;
    }
    stratum_swapObject2d(hspace: number, hojb1: number, hojb2: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.swapObjects(hojb1, hojb2) : 0;
    }

    // Функции для работы с полилиниями
    //
    stratum_createPolyLine2d(hspace: number, hpen: number, hbrush: number, ...coords: number[]): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createLine(coords, hpen, hbrush) : 0;
    }
    stratum_createLine2d(hspace: number, hpen: number, hbrush: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createLine([x, y], hpen, hbrush) : 0;
    }
    stratum_addPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.addPoint(index, x, y) : 0;
    }
    stratum_delpoint2d(hspace: number, hline: number, index: number): NumBool {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.deletePoint(index) : 0;
    }
    stratum_getPenObject2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.penHandle() : 0;
    }
    stratum_getBrushObject2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.brushHandle() : 0;
    }
    stratum_getVectorNumPoints2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.pointCount() : 0;
    }
    stratum_getVectorPoint2dx(hspace: number, hline: number, index: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.pointOriginX(index) : 0;
    }
    stratum_getVectorPoint2dy(hspace: number, hline: number, index: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.pointOriginY(index) : 0;
    }
    // stratum_setBrushObject2d(hspace : number, hline : number, hbrush : number) : NumBool {}
    // stratum_setPenObject2d(hspace : number, hline : number, hpen : number) : NumBool {}
    stratum_setVectorPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.setPointOrigin(index, x, y) : 0;
    }

    // Функции для работы с группами
    stratum_createGroup2d(hspace: number, ...hobject: number[]): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createGroup(hobject) : 0;
    }
    stratum_deleteGroup2d(hspace: number, hgroup: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.deleteGroup2d(hgroup) : 0;
    }

    stratum_addGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        const obj = this.getObject(hspace, hgroup);
        return typeof obj !== "undefined" ? obj.addItem(hobject) : 0;
    }
    stratum_delGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        const obj = this.getObject(hspace, hgroup);
        return typeof obj !== "undefined" ? obj.deleteItem(hobject) : 0;
    }

    // stratum_getGroupItemsNum2d(hspace: number, hgroup: number): number {}
    stratum_getGroupItem2d(hspace: number, hgroup: number, index: number): number {
        const obj = this.getObject(hspace, hgroup);
        return typeof obj !== "undefined" ? obj.itemHandle(index) : 0;
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
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.parentHandle() : 0;
    }
    // FLOAT IsGroupContainObject2d(HANDLE HSpace, HANDLE HGroup, HANDLE HObject)

    // Прочее
    //
    stratum_isObjectsIntersect2d(hspace: number, hobj1: number, hobj2: number /*flags: number*/): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.isIntersect(hobj1, hobj2) : 0;
    }

    // Объект Контрол
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
        return this.arrays.get(handle)?.insert(type) ?? 0;
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
