import { PlayerOptions, WindowHost } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { crefToB, crefToG, crefToR, rgbToCref } from "stratum/common/colorrefParsers";
import { VarType } from "stratum/common/varType";
import { Hyperbase, VectorDrawing } from "stratum/fileFormats/vdr";
import { SceneWindow } from "stratum/graphics/sceneWindow";
import { HandleMap } from "stratum/helpers/handleMap";
import { win1251Table } from "stratum/helpers/win1251";
import { Project, ProjectMemory, ProjectResources, Schema } from "stratum/project";
import { VFS, VFSDir } from "stratum/vfs";
import { Constant, Env, EventSubscriber, NumBool } from ".";
import { EnvStream } from "./envStream";
import { NeoMatrix } from "./neoMatrix";

export class Enviroment {
    private static readonly startupTime = new Date().getTime();
    static readonly keyState = new Uint8Array(256);

    private windows = new Map<string, Env.Window>();
    private scenes = new Map<number, Env.Scene>();
    private hspaceToWname = new Map<number, string>();
    private wnameToHspace = new Map<string, number>();
    private targetScene: Env.Scene | null = null;

    private matrices = new Map<number, NeoMatrix>();
    private streams = new Map<number, EnvStream>();

    private host: WindowHost;

    private _shouldQuit: boolean = false;
    private lib: ClassLibrary;

    private projects: Project[];
    private inHyperCall: boolean;

    private options: PlayerOptions;

    constructor(res: ProjectResources, host: WindowHost, options: PlayerOptions = {}) {
        this.projects = [new Project(this, res)];
        this.lib = res.classes;
        this.host = host;
        this.inHyperCall = false;
        this.options = options;
    }

    compute(): boolean {
        const res = this.projects[this.projects.length - 1].compute();

        // Среда остановлена
        if (this._shouldQuit) {
            this.closeAllRes();
            return false;
        }

        // Проект работает
        if (res === true) return true;

        // Проект не работает и это не последний проект
        if (this.projects.length > 1) {
            // Это не последний проект
            const id = this.sessionId();
            this.closeProjectRes(id);
            this.projects.pop();
            return true;
        }

        // Проект не работает и это последний проект
        this.closeAllRes();
        return false;
    }

    private sessionId(): number {
        return this.projects.length - 1;
    }

    callFunction(fname: string, schema: Schema, ...args: (string | number)[]): void | string | number {
        const obj = this.lib.get(fname);
        const mod = obj?.model(this.lib);
        if (!mod?.isFunction) throw Error();
        const vars = obj?.vars;
        let floats = 0;
        const f1: number[] = [];
        let ints = 0;
        const i1: number[] = [];
        let strings = 0;
        const sarr: string[] = [];
        const tlb = new Uint16Array(vars?.count ?? 0);
        if (vars && args.length > 0) {
            if (args.length > vars.count) throw Error("Кол-во аргументов больше кол-ва переменных");
            let i = 0;
            for (; i < vars.count; ++i) {
                const val = (i < args.length ? args : vars.defaultValues)[i];
                const typ = vars.types[i];
                switch (typ) {
                    case VarType.Float:
                        if (typeof val === "string") throw Error("Несовпадение типов");
                        tlb[i] = floats;
                        floats += 1;
                        f1.push(val ?? 0);
                        break;
                    case VarType.Handle:
                    case VarType.ColorRef:
                        if (typeof val === "string") throw Error("Несовпадение типов");
                        tlb[i] = ints;
                        ints += 1;
                        i1.push(val ?? 0);
                        break;
                    case VarType.String:
                        if (typeof val === "number") throw Error("Несовпадение типов");
                        tlb[i] = strings;
                        strings += 1;
                        sarr.push(val ?? "");
                        break;
                }
            }
        }
        const farr = new Float64Array(f1);
        const iarr = new Int32Array(i1);

        const mem: ProjectMemory = {
            newFloats: farr,
            oldFloats: farr,
            newInts: iarr,
            oldInts: iarr,
            newStrings: sarr,
            oldStrings: sarr,
        };

        let code = 0;
        while ((code = mod.model(schema, tlb, mem, code)) > 0);
        if (!vars) return;
        const ret = vars.flags.findIndex((v) => v & Constant.VF_RETURN);
        if (ret < 0) return;
        const t = vars.types[ret];
        if (t === VarType.String) return sarr[tlb[ret]];
        if (t === VarType.Float) return farr[tlb[ret]];
        return iarr[tlb[ret]];
    }

    stratum_setHyperJump2d(hspace: number, hobject: number, mode: number, ...args: string[]): NumBool {
        if (mode !== 2) return 0;
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

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

    stratum_stdHyperJump(hspace: number, x: number, y: number, hobject: number, flags: number) {
        this.scenes.get(hspace)?.tryHyper(x, y, hobject);
    }

    async hyperCall(dir: VFSDir, hyp: Hyperbase): Promise<void> {
        if (this.inHyperCall) return;
        this.inHyperCall = true;
        const mode = hyp.openMode ?? 0;
        switch (mode) {
            case 2: {
                if (!hyp.target) return;
                const file = dir.get(hyp.target);
                if (!file || file.dir) return;

                const c = document.body.style.cursor;
                document.body.style.cursor = "wait";
                try {
                    const data = await VFS.project(file, this.lib, this.sessionId() + 1);
                    this.inHyperCall = false;
                    if (this._shouldQuit) return;
                    this.projects.push(new Project(this, data));
                } catch (e) {
                    console.error(e);
                    this._shouldQuit = true;
                } finally {
                    document.body.style.cursor = c;
                }
                break;
            }
            default:
                console.log(hyp);
        }
        this.inHyperCall = false;
    }

    stratum_isDlgButtonChecked2d(hspace: number, hobject: number): number {
        return 0;
    }

    stratum_checkDlgButton2d(hspace: number, hobject: number, state: number): NumBool {
        return 1;
    }

    stratum_setObjectAttribute2d(hspace: number, hobject: number, attr: number, flag: number): NumBool {
        return 1;
    }

    stratum_ascii(str: string): number {
        if (str.length === 0) return 0;
        const idx = win1251Table.indexOf(str[0]);
        return idx < 0 ? 0 : idx;
    }

    stratum_chr(n: number): string {
        if (n < 0 || n > 255) return "";
        return win1251Table[n];
    }

    getTime(arr1: Env.Farr, hour: number, arr2: Env.Farr, min: number, arr3: Env.Farr, sec: number, arr4: Env.Farr, hund: number): void {
        const time = new Date();
        arr1[hour] = time.getHours();
        arr2[min] = time.getMinutes();
        arr3[sec] = time.getSeconds();
        arr4[hund] = time.getMilliseconds() * 0.1;
    }

    getDate(arr1: Env.Farr, year: number, arr2: Env.Farr, mon: number, arr3: Env.Farr, day: number): void {
        const time = new Date();
        arr1[year] = time.getFullYear();
        arr2[mon] = time.getMonth();
        arr3[day] = time.getDate();
    }
    stratum_getTickCount(): number {
        return new Date().getTime() - Enviroment.startupTime;
    }
    stratum_new() {
        throw Error("Функция New не реализована");
    }
    stratum_logMessage(msg: string): void {}
    stratum_MCISendString(): number {
        return Constant.MCIERR_INVALID_DEVICE_NAME;
    }

    stratum_MCISendStringStr(): string {
        return "";
    }

    stratum_system(command: number, ...params: number[]): number {
        return 0;
    }

    stratum_getAsyncKeyState(vkey: number): number {
        return Enviroment.keyState[vkey] > 0 ? 1 : 0;
    }

    stratum_quit(flag: number): void {
        if (flag <= 0) return;
        this._shouldQuit = true;
    }
    openSchemeWindow(prj: Env.Project, wname: string, className: string, attrib: string): number {
        const existHandle = this.wnameToHspace.get(wname);
        if (typeof existHandle !== "undefined") return existHandle;

        const vdr = this.lib.getComposedScheme(className);
        return this.openWindow(prj, wname, attrib, vdr);
    }
    loadSpaceWindow(prj: Env.Project, wname: string, fileName: string, attrib: string): number {
        const existHandle = this.wnameToHspace.get(wname);
        if (typeof existHandle !== "undefined") return existHandle;

        const file = prj.dir.get(fileName);
        const vdr = file && !file.dir ? file.readSyncAs("vdr") : undefined;
        return this.openWindow(prj, wname, attrib, vdr);
    }

    createWindowEx(prj: Env.Project, wname: string, parentWname: string, source: string, x: number, y: number, w: number, h: number, attrib: string): number {
        const existHandle = this.wnameToHspace.get(wname);
        if (typeof existHandle !== "undefined") return existHandle;

        let vdr = this.lib.getComposedScheme(source);
        if (!vdr) {
            const file = prj.dir.get(source);
            vdr = file && !file.dir ? file.readSyncAs("vdr") : undefined;
        }

        const p = this.windows.get(parentWname);
        if (!p) {
            return this.openWindow(prj, wname, attrib, vdr);
        }
        return this.openWindow(prj, wname, attrib, vdr);

        return 0;

        // const wnd: SceneWindow = p.openEx(wname, vdr);
        // const handle = HandleMap.getFreeHandle(this.scenes);
        // this.hspaceToWname.set(handle, wname);
        // this.wnameToHspace.set(wname, handle);
        // this.scenes.set(handle, wnd.scene);
        // this.windows.set(wname, wnd);
        // return handle;
    }

    //#region Окна
    stratum_getClientHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.height() : 0;
    }
    stratum_getClientWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.width() : 0;
    }
    stratum_getWindowName(hspace: number): string {
        const wname = this.hspaceToWname.get(hspace);
        return typeof wname !== "undefined" ? wname : "";
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
        const handle = this.wnameToHspace.get(wname);
        return typeof handle !== "undefined" ? handle : 0;
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
        return typeof wnd !== "undefined" ? wnd.setSize(width, height) : 0;
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
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.getProp(prop) : "";
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
        if (typeof wnd === "undefined") return 0;
        wnd.close();
        this.removeWindow(wname);
        return 1;
    }
    stratum_setWindowTransparent(wname: string, level: number): NumBool;
    stratum_setWindowTransparent(hspace: number, level: number): NumBool;
    stratum_setWindowTransparent(wnameOrHspace: number | string, level: number): NumBool {
        const wname = typeof wnameOrHspace === "string" ? wnameOrHspace : this.hspaceToWname.get(wnameOrHspace);
        if (!wname) return 0;
        return this.windows.get(wname)?.setTransparent(level) ?? 0;
    }
    stratum_setWindowTransparentColor(wname: string, cref: number): NumBool;
    stratum_setWindowTransparentColor(hspace: number, cref: number): NumBool;
    stratum_setWindowTransparentColor(wnameOrHspace: number | string, cref: number): NumBool {
        const wname = typeof wnameOrHspace === "string" ? wnameOrHspace : this.hspaceToWname.get(wnameOrHspace);
        if (!wname) return 0;
        return this.windows.get(wname)?.setTransparentColor(cref) ?? 0;
    }
    stratum_setWindowOwner(hspace: number, hownerSpace: number): NumBool {
        return 1;
    }
    //#endregion

    //#region ГРАФИКА
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

    private lockSpace2dS = false;
    stratum_lockSpace2d(hspace: number, lock: number): number {
        if (!this.lockSpace2dS) {
            console.warn("LockSpace2d игнорируется");
            this.lockSpace2dS = true;
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
    createDIB2d(dir: VFSDir, hspace: number, fileName: string): number {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        const file = dir.get(fileName);
        const dib = file && !file.dir && file.readSyncAs("bmp");
        return dib ? scene.createDIBTool(dib) : 0;
    }

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
    createDoubleDib2D(dir: VFSDir, hspace: number, fileName: string): number {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        const file = dir.get(fileName);
        const ddib = file && !file.dir && file.readSyncAs("dbm");
        return ddib ? scene.createDoubleDIBTool(ddib) : 0;
    }

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
    createObjectFromFile2D(dir: VFSDir, hspace: number, fileName: string, x: number, y: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        const file = dir.get(fileName);
        const vdr = file && !file.dir && file.readSyncAs("vdr");
        return vdr ? scene.insertVectorDrawing(x, y, flags, vdr) : 0;
    }
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
    getActualSize2d(hspace: number, hobject: number, xArr: Env.Farr, xId: number, yArr: Env.Farr, yId: number): NumBool {
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
    stratum_isObjectsIntersect2d(hspace: number, hobj1: number, hobj2: number, flags: number): NumBool {
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

    //#region ФУНКЦИИ РАБОТЫ С ФАЙЛАМИ
    stratum_getClassDirectory(className: string): string {
        const proto = this.lib.get(className);
        return typeof proto !== "undefined" ? proto.directoryDos : "";
    }
    stratum_closeClassScheme(className: string): NumBool {
        return 1;
    }
    //#endregion

    //#region СИСТЕМНЫЕ ФУНКЦИИ
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
        return this.host.width;
    }
    stratum_getWorkAreaHeight(): number {
        return this.host.height;
    }
    //#endregion

    // Методы EventDispatcher
    subscribe(sub: EventSubscriber, wnameOrHspace: string | number, obj2d: number, code: Constant) {
        const nm = typeof wnameOrHspace === "string" ? wnameOrHspace : this.hspaceToWname.get(wnameOrHspace);
        if (!nm) return;
        const wnd = this.windows.get(nm);
        if (typeof wnd === "undefined") return;

        switch (code) {
            case Constant.WM_CONTROLNOTIFY:
                wnd.onControlNotifty(sub, obj2d);
                break;
            case Constant.WM_MOVE:
                break;
            case Constant.WM_SIZE:
                wnd.onResize(sub);
                break;
            case Constant.WM_SPACEDONE:
                wnd.onSpaceDone(sub);
                break;
            // case Constant.WM_DESTROY:
            //     wnd.onDestroy(sub);
            //     break;
            case Constant.WM_MOUSEMOVE:
            case Constant.WM_LBUTTONDOWN:
            case Constant.WM_LBUTTONUP:
            case Constant.WM_LBUTTONDBLCLK:
            case Constant.WM_RBUTTONDOWN:
            case Constant.WM_RBUTTONUP:
            case Constant.WM_RBUTTONDBLCLK:
            case Constant.WM_MBUTTONDOWN:
            case Constant.WM_MBUTTONUP:
            case Constant.WM_MBUTTONDBLCLK:
            case Constant.WM_ALLMOUSEMESSAGE: {
                wnd.onMouse(sub, code, obj2d);
                break;
            }
            default:
                this._unsub.add(Constant[code]);
                if (this._unsub.size > this._unsubS) {
                    this._unsubS = this._unsub.size;
                    console.warn(`Подписка на ${Constant[code]} не реализована`);
                }
                break;
        }
    }
    private _unsub = new Set<string>();
    private _unsubS = 0;

    unsubscribe(sub: EventSubscriber, wnameOrHspace: string | number, code: Constant) {
        const nm = typeof wnameOrHspace === "string" ? wnameOrHspace : this.hspaceToWname.get(wnameOrHspace);
        if (!nm) return;
        const wnd = this.windows.get(nm);
        if (typeof wnd === "undefined") return;

        switch (code) {
            case Constant.WM_CONTROLNOTIFY:
                wnd.offControlNotify(sub);
                break;
            case Constant.WM_SIZE:
                wnd.offResize(sub);
                break;
            case Constant.WM_SPACEDONE:
                wnd.offSpaceDone(sub);
                break;
            // case Constant.WM_DESTROY:
            //     wnd.offDestroy(sub);
            //     break;
            case Constant.WM_MOUSEMOVE:
            case Constant.WM_LBUTTONDOWN:
            case Constant.WM_LBUTTONUP:
            case Constant.WM_LBUTTONDBLCLK:
            case Constant.WM_RBUTTONDOWN:
            case Constant.WM_RBUTTONUP:
            case Constant.WM_RBUTTONDBLCLK:
            case Constant.WM_MBUTTONDOWN:
            case Constant.WM_MBUTTONUP:
            case Constant.WM_MBUTTONDBLCLK:
            case Constant.WM_ALLMOUSEMESSAGE: {
                wnd.offMouse(sub, code);
                break;
            }
        }
    }

    setCapture(hspace: number, sub: EventSubscriber) {
        const scene = this.scenes.get(hspace);
        if (typeof scene !== "undefined") (this.targetScene = scene).setCapture(sub);
    }
    stratum_releaseCapture(): void {
        if (this.targetScene === null) return;
        this.targetScene.releaseCapture();
        this.targetScene = null;
    }
    //#endregion

    // Эти методы вызываются из Player, т.к. он отвечает за загрузку файлов.
    private openWindow(prj: Env.Project, wname: string, attribute: string, vdr?: VectorDrawing): number {
        const a = attribute.toUpperCase();
        const noCaption = a.includes("WS_NOCAPTION");

        const wnd: Env.Window = new SceneWindow(this.host, {
            title: wname,
            vdr,
            noCaption,
            disableResize: this.options.disableWindowResize,
            onClosed: () => this.removeWindow(wname),
        });
        wnd.id = this.sessionId();
        this.windows.set(wname, wnd);

        const handle = HandleMap.getFreeHandle(this.scenes);
        this.wnameToHspace.set(wname, handle);
        this.hspaceToWname.set(handle, wname);
        this.scenes.set(handle, wnd.scene);
        wnd.scene.hyperTarget = prj;
        return handle;
    }

    private removeWindow(wname: string): void {
        this.windows.delete(wname);

        const handle = this.wnameToHspace.get(wname);
        if (typeof handle === "undefined") return;

        this.wnameToHspace.delete(wname);
        this.hspaceToWname.delete(handle);
        const scene = this.scenes.get(handle);
        this.scenes.delete(handle);
        if (scene === this.targetScene) {
            this.targetScene?.releaseCapture();
            this.targetScene = null;
        }
    }

    private closeProjectRes(id: number): void {
        const prjWindows = [...this.windows].filter((w) => w[1].id === id);
        prjWindows.forEach((w) => {
            w[1].close();
            this.removeWindow(w[0]);
        });
        this.lib.remove(id);
    }

    closeAllRes(): void {
        this._shouldQuit = true;
        this.windows.forEach((w) => {
            w.close();
        });
        this.hspaceToWname.clear();
        this.wnameToHspace.clear();
        this.scenes.clear();
        this.windows.clear();
        this.targetScene?.releaseCapture();
        this.targetScene = null;
        this.streams.forEach((s) => s.close());
        for (let i = 1; i < this.projects.length; ++i) {
            this.lib.remove(i);
        }
    }

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
    // private getTDoubleDIB(hspace: number, htool: number) {
    //     const scene = this.scenes.get(hspace);
    //     return typeof scene !== "undefined" ? scene.doubleDibs.get(htool) : undefined;
    // }
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

    //#region МАТРИЦЫ
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
    stratum_mEditor(q: number, flag: number): NumBool {
        if (flag <= 0) return 0;
        throw Error("MEditor: редактор матриц не реализован");
    }
    // stratum_mDiag

    mSaveAs(dir: VFSDir, q: number, fileName: string, flag: number): NumBool {
        if (flag <= 0) return 0;
        throw Error("не реализовано");
    }
    mLoad(dir: VFSDir, q: number, fileName: string, flag: number): number {
        if (flag <= 0) return 0;

        const f = dir.get(fileName);
        if (!f || f.dir) return 0;
        const data = f.readSyncAs("mat");
        if (!data) return 0;

        const handle = q === 0 ? HandleMap.getFreeNegativeHandle(this.matrices) : q;
        this.matrices.set(handle, new NeoMatrix(data));
        return handle;
    }
    //#endregion

    //#region ПОТОКИ
    createStream(dir: VFSDir, type: string, name: string, flags: string): number {
        const t = type.toUpperCase();

        const needCreate = flags.toUpperCase().includes("CREATE");

        const handle = HandleMap.getFreeHandle(this.streams);
        let stream: EnvStream;

        if (t === "FILE") {
            const f = needCreate ? dir.create("file", name) : dir.get(name);
            if (!f || f.dir) return 0;
            stream = new EnvStream({
                data: needCreate ? undefined : f.bufferSync(),
                onFlush: (d) => f.write(d),
            });
        } else if (t === "MEMORY") {
            stream = new EnvStream();
        } else {
            throw Error(`Поток типа ${t} не поддерживается`);
        }

        this.streams.set(handle, stream);
        return handle;
    }

    stratum_closeStream(hstream: number): NumBool {
        return this.streams.get(hstream)?.close() ?? 0;
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
}
