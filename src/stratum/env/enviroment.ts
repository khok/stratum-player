import { Project, SmoothExecutor, WindowHost } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { VarType } from "stratum/common/varType";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { SceneWindow } from "stratum/graphics/sceneWindow";
import { HandleMap } from "stratum/helpers/handleMap";
import { VFSDir } from "stratum/vfs";
import { Constant, Env, EventSubscriber, MemorySize, NumBool } from ".";

// FIXME: можно подставить Float32Array, если нужен небольшой перформанс.
type Farr = Float64Array;
export class Enviroment {
    private static readonly startupTime = new Date().getTime();
    static readonly keyState = new Uint8Array(256);

    private computer = new SmoothExecutor();
    private hspaceToWname = new Map<number, string>();
    private wnameToHspace = new Map<string, number>();
    private scenes = new Map<number, Env.Scene>();
    private windows = new Map<string, SceneWindow>();

    private targetScene: Env.Scene | null = null;

    level = 0;

    oldFloats: Farr;
    newFloats: Farr;

    oldInts: Int32Array;
    newInts: Int32Array;

    oldStrings: string[];
    newStrings: string[];

    olds: { [index: number]: Farr | Int32Array | string[] };
    news: { [index: number]: Farr | Int32Array | string[] };

    shouldClose: boolean;

    constructor(private classes: ClassLibrary, private dir: VFSDir, public host: WindowHost) {
        this.oldFloats = new Float64Array(0);
        this.newFloats = new Float64Array(0);
        this.oldInts = new Int32Array(0);
        this.newInts = new Int32Array(0);
        this.oldStrings = [];
        this.newStrings = [];
        this.olds = [];
        this.news = [];
        this.shouldClose = false;
    }

    init({ floatsCount, intsCount, stringsCount }: MemorySize) {
        this.oldFloats = new Float64Array(floatsCount);
        this.newFloats = new Float64Array(floatsCount);

        this.oldInts = new Int32Array(intsCount);
        this.newInts = new Int32Array(intsCount);

        this.oldStrings = new Array<string>(stringsCount).fill("");
        this.newStrings = new Array<string>(stringsCount).fill("");

        this.olds[VarType.Float] = this.oldFloats;
        this.olds[VarType.Handle] = this.oldInts;
        this.olds[VarType.ColorRef] = this.oldInts;
        this.olds[VarType.String] = this.oldStrings;

        this.news[VarType.Float] = this.newFloats;
        this.news[VarType.Handle] = this.newInts;
        this.news[VarType.ColorRef] = this.newInts;
        this.news[VarType.String] = this.newStrings;
        return this;
    }

    sync() {
        this.oldFloats.set(this.newFloats);
        this.oldInts.set(this.newInts);
        for (let i = 0; i < this.newStrings.length; ++i) this.oldStrings[i] = this.newStrings[i];
        return this;
    }

    /**
     * Проверка, не было ли изменено (в результате багов) зарезервированное значение.
     */
    assertZeroIndexEmpty() {
        if (
            this.oldFloats[0] !== 0 ||
            "undefined" in this.oldFloats ||
            this.newFloats[0] !== 0 ||
            "undefined" in this.newFloats ||
            this.oldInts[0] !== 0 ||
            "undefined" in this.oldInts ||
            this.newInts[0] !== 0 ||
            "undefined" in this.newInts ||
            this.oldStrings[0] !== "" ||
            "undefined" in this.oldStrings ||
            this.newStrings[0] !== "" ||
            "undefined" in this.newStrings
        )
            throw Error("Было изменено зарезервированное значение переменной");
    }

    stratum_getTime(arr1: Farr, hour: number, arr2: Farr, min: number, arr3: Farr, sec: number, arr4: Farr, hund: number): void {
        const time = new Date();
        arr1[hour] = time.getHours();
        arr2[min] = time.getMinutes();
        arr3[sec] = time.getSeconds();
        arr4[hund] = time.getMilliseconds() * 0.1;
    }

    stratum_getDate(arr1: Farr, year: number, arr2: Farr, mon: number, arr3: Farr, day: number): void {
        const time = new Date();
        arr1[year] = time.getFullYear();
        arr2[mon] = time.getMonth();
        arr3[day] = time.getDate();
    }
    stratum_getTickCount(): number {
        return new Date().getTime() - Enviroment.startupTime;
    }
    stratum_rgb(r: number, g: number, b: number): number {
        return r | (g << 8) | (b << 16);
    }
    stratum_rgbEx(r: number, g: number, b: number, type: number): number {
        const flag = type === 1 ? 1 << 24 : type === 2 ? 2 << 24 : 0;
        return r | (g << 8) | (b << 16) | flag;
    }
    stratum_newArray() {
        throw Error("Функция New не реализована");
    }
    stratum_logMessage(msg: string): void {}
    stratum_MCISendString(): number {
        return 263;
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

    stratum_closeAll(): void {
        this.shouldClose = true;
    }
    stratum_quit(flag: number): void {
        if (flag <= 0) return;
        this.shouldClose = true;
    }
    stratum_openSchemeWindow(wname: string, className: string, attrib: string): number {
        const vdr = this.classes.getComposedScheme(className);
        return this.openWindow(wname, attrib, vdr);
    }
    stratum_loadSpaceWindow(wname: string, fileName: string, attrib: string): number {
        const file = this.dir.get(fileName);
        const vdr = file && !file.dir ? file.readSyncAs("vdr") : undefined;
        return this.openWindow(wname, attrib, vdr);
    }
    stratum_createWindowEx(wname: string, parentWname: string, source: string, x: number, y: number, w: number, h: number, attrib: string): number {
        const existHandle = this.wnameToHspace.get(wname);
        if (typeof existHandle !== "undefined") return existHandle;

        let vdr = this.classes.getComposedScheme(source);
        if (!vdr) {
            const file = this.dir.get(source);
            vdr = file && !file.dir ? file.readSyncAs("vdr") : undefined;
        }

        const p = this.windows.get(parentWname);
        if (!p) {
            return this.openWindow(wname, attrib, vdr);
        }

        const wnd: SceneWindow = p.openEx(wname, vdr);
        const handle = HandleMap.getFreeHandle(this.scenes);
        this.hspaceToWname.set(handle, wname);
        this.wnameToHspace.set(wname, handle);
        this.scenes.set(handle, wnd.scene);
        this.windows.set(wname, wnd);
        return handle;
    }
    stratum_createObjectFromFile2D(hspace: number, fileName: string, x: number, y: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        const file = this.dir.get(fileName);
        const vdr = file && !file.dir && file.readSyncAs("vdr");
        return vdr ? scene.insertVectorDrawing(x, y, flags, vdr) : 0;
    }
    stratum_getClassDirectory(className: string): string {
        const proto = this.classes.get(className);
        return typeof proto !== "undefined" ? proto.directoryDos : "";
    }
    stratum_fileExist(fileName: string): NumBool {
        const file = this.dir.get(fileName);
        return typeof file !== "undefined" ? 1 : 0;
    }

    // Пространства
    stratum_getWindowName(hspace: number): string {
        const wname = this.hspaceToWname.get(hspace);
        return typeof wname !== "undefined" ? wname : "";
    }
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

    // Общие операции над объектами пространства
    stratum_getObjectOrg2dx(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.originX() : 0;
    }
    stratum_getObjectOrg2dy(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.originY() : 0;
    }
    stratum_setObjectOrg2d(hspace: number, hobject: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setOrigin(x, y) : 0;
    }
    stratum_getObjectAngle2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.angle() : 0;
    }
    stratum_rotateObject2d(hspace: number, hobject: number, centerX: number, centerY: number, angle: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.rotate(centerX, centerY, angle) : 0;
    }
    stratum_getActualWidth2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.actualWidth() : 0;
    }
    stratum_getActualHeight2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.actualHeight() : 0;
    }
    stratum_getActualSize2d(hspace: number, hobject: number, xArr: Farr, xId: number, yArr: Farr, yId: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        if (typeof obj === "undefined") return 0;
        xArr[xId] = obj.actualWidth();
        yArr[yId] = obj.actualHeight();
        return 1;
    }
    stratum_getObjectWidth2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.width() : 0;
    }
    stratum_getObjectHeight2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.height() : 0;
    }
    stratum_setObjectSize2d(hspace: number, hobject: number, sizeX: number, sizeY: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setSize(sizeX, sizeY) : 0;
    }
    stratum_getZOrder2d(hspace: number, hobject: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.getObjectZOrder(hobject) : 0;
    }
    stratum_setZOrder2d(hspace: number, hobject: number, zOrder: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setObjectZOrder(hobject, zOrder) : 0;
    }
    stratum_setObjectName2d(hspace: number, hobject: number, name: string): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.setObjectName(hobject, name) : 0;
    }
    stratum_setShowObject2d(hspace: number, hobject: number, visible: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.setShow(visible) : 0;
    }
    stratum_objectToTop2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.moveObjectToTop(hobject) : 0;
    }
    stratum_objectToBottom2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.moveObjectToBottom(hobject) : 0;
    }
    stratum_deleteObject2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.deleteObject(hobject) : 0;
    }

    // Группы
    stratum_createGroup2d(hspace: number, ...hobject: number[]): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createGroup(hobject) : 0;
    }
    stratum_addGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        const obj = this.getObject(hspace, hgroup);
        return typeof obj !== "undefined" ? obj.addItem(hobject) : 0;
    }

    stratum_getGroupItem2d(hspace: number, hgroup: number, index: number): number {
        const obj = this.getObject(hspace, hgroup);
        return typeof obj !== "undefined" ? obj.itemHandle(index) : 0;
    }
    stratum_delGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        const obj = this.getObject(hspace, hgroup);
        return typeof obj !== "undefined" ? obj.deleteItem(hobject) : 0;
    }
    stratum_getObject2dByName(hspace: number, hgroup: number, name: string): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.getObject2dByName(hgroup, name) : 0;
    }
    stratum_getObjectParent2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.parentHandle() : 0;
    }
    stratum_deleteGroup2d(hspace: number, hgroup: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.deleteGroup2d(hgroup) : 0;
    }

    // Прочее
    stratum_getObjectFromPoint2d(hspace: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.getObjectFromPoint2d(x, y) : 0;
    }
    stratum_isObjectsIntersect2d(hspace: number, obj1: number, obj2: number, flags: number): NumBool {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.isIntersect(obj1, obj2) : 0;
    }

    // Polyline
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

    stratum_getVectorPoint2dx(hspace: number, hline: number, index: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.pointOriginX(index) : 0;
    }
    stratum_getVectorPoint2dy(hspace: number, hline: number, index: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.pointOriginY(index) : 0;
    }
    stratum_setVectorPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.setPointOrigin(index, x, y) : 0;
    }
    stratum_getPenObject2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.penHandle() : 0;
    }
    stratum_getBrushObject2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return typeof obj !== "undefined" ? obj.brushHandle() : 0;
    }

    // Объект Текст
    stratum_createRasterText2D(hspace: number, htext: number, x: number, y: number, angle: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createText(x, y, angle, htext) : 0;
    }
    stratum_getTextObject2d(hspace: number, hojbect: number): number {
        const obj = this.getObject(hspace, hojbect);
        return typeof obj !== "undefined" ? obj.textToolHandle() : 0;
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

    // Объект битмап
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
    stratum_getDoubleDibObject2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return typeof obj !== "undefined" ? obj.doubleDIBHandle() : 0;
    }

    // Инструмент Pen
    stratum_createPen2d(hspace: number, style: number, width: number, color: number, rop2: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createPenTool(style, width, color, rop2) : 0;
    }
    stratum_getPenStyle2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.style() : 0;
    }
    stratum_setPenStyle2d(hspace: number, hpen: number, style: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.setStyle(style) : 0;
    }
    stratum_getPenWidth2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.width() : 0;
    }
    stratum_setPenWidth2d(hspace: number, hpen: number, width: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.setWidth(width) : 0;
    }
    stratum_getPenColor2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.color() : 0;
    }
    stratum_setPenColor2d(hspace: number, hpen: number, color: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.setColor(color) : 0;
    }
    stratum_getPenRop2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.rop() : 0;
    }
    stratum_setPenRop2d(hspace: number, hpen: number, rop: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return typeof tool !== "undefined" ? tool.setRop(rop) : 0;
    }

    // Инструмент Brush
    stratum_createBrush2d(hspace: number, style: number, hatch: number, color: number, hdib: number, type: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createBrushTool(style, hatch, color, hdib, type) : 0;
    }
    stratum_getBrushStyle2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.style() : 0;
    }
    stratum_setBrushStyle2d(hspace: number, hbrush: number, style: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.setStyle(style) : 0;
    }
    stratum_getBrushHatch2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.hatch() : 0;
    }
    stratum_setBrushHatch2d(hspace: number, hbrush: number, hatch: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.setHatch(hatch) : 0;
    }
    stratum_getBrushColor2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.color() : 0;
    }
    stratum_setBrushColor2d(hspace: number, hbrush: number, color: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.setColor(color) : 0;
    }
    stratum_getBrushRop2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.rop() : 0;
    }
    stratum_setBrushRop2d(hspace: number, hbrush: number, rop: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return typeof tool !== "undefined" ? tool.setRop(rop) : 0;
    }

    // Инструмент Битовая карта
    stratum_createDIB2d(hspace: number, fileName: string): number {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        const file = this.dir.get(fileName);
        const dib = file && !file.dir && file.readSyncAs("bmp");
        return dib ? scene.createDIBTool(dib) : 0;
    }
    stratum_createDoubleDib2D(hspace: number, fileName: string): number {
        const scene = this.scenes.get(hspace);
        if (typeof scene === "undefined") return 0;

        const file = this.dir.get(fileName);
        const ddib = file && !file.dir && file.readSyncAs("dbm");
        return ddib ? scene.createDoubleDIBTool(ddib) : 0;
    }
    stratum_getDibPixel2D(hspace: number, hdib: number, x: number, y: number): number {
        const tool = this.getTDIB(hspace, hdib);
        return typeof tool !== "undefined" ? tool.getPixel(x, y) : 0;
    }

    stratum_setDibPixel2D(hspace: number, hdib: number, x: number, y: number, colorref: number): number {
        const tool = this.getTDIB(hspace, hdib);
        return typeof tool !== "undefined" ? tool.setPixel(x, y, colorref) : 0;
    }

    // Инструмент Текст
    stratum_createText2D(hspace: number, hfont: number, hstring: number, fgColor: number, bgColor: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createTextTool(hfont, hstring, fgColor, bgColor) : 0;
    }
    stratum_getTextCount2d(hspace: number, htext: number): number {
        const tool = this.getTText(hspace, htext);
        return typeof tool !== "undefined" ? tool.textCount() : 0;
    }
    stratum_getTextFont2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return typeof tool !== "undefined" ? tool.fontHandle(index) : 0;
    }
    stratum_getTextString2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return typeof tool !== "undefined" ? tool.stringHandle(index) : 0;
    }
    stratum_getTextFgColor2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return typeof tool !== "undefined" ? tool.fgColor(index) : 0;
    }
    stratum_getTextBkColor2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return typeof tool !== "undefined" ? tool.bgColor(index) : 0;
    }

    stratum_setText2D(hspace: number, htext: number, /*          */ hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    stratum_setText2D(hspace: number, htext: number, index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    stratum_setText2D(hspace: number, htext: number, a1: number, a2: number, a3: number, a4: number, a5?: number): NumBool {
        const tool = this.getTText(hspace, htext);
        if (typeof tool === "undefined") return 0;

        const index = typeof a5 !== "undefined" ? a1 : 0;
        const hfont = typeof a5 !== "undefined" ? a2 : a1;
        const hstring = typeof a5 !== "undefined" ? a3 : a2;
        const fgColor = typeof a5 !== "undefined" ? a4 : a3;
        const bgColor = typeof a5 !== "undefined" ? a5 : a4;

        return tool.setValues(index, hfont, hstring, fgColor, bgColor);
    }

    // Инструмент Строка
    stratum_createString2D(hspace: number, value: string): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createStringTool(value) : 0;
    }
    stratum_getstring2d(hspace: number, hstring: number): string {
        const tool = this.getTString(hspace, hstring);
        return typeof tool !== "undefined" ? tool.text() : "";
    }
    stratum_setString2d(hspace: number, hstring: number, value: string): NumBool {
        const tool = this.getTString(hspace, hstring);
        return typeof tool !== "undefined" ? tool.setText(value) : 0;
    }

    // Инструмент Шрифт
    stratum_createFont2D(hspace: number, fontName: string, height: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        return typeof scene !== "undefined" ? scene.createFontTool(fontName, height, flags) : 0;
    }
    stratum_getFontName2d(hspace: number, hfont: number): string {
        const tool = this.getTFont(hspace, hfont);
        return typeof tool !== "undefined" ? tool.name() : "";
    }
    stratum_getFontSize2d(hspace: number, hfont: number): number {
        const tool = this.getTFont(hspace, hfont);
        return typeof tool !== "undefined" ? tool.size() : 0;
    }
    stratum_getFontStyle2d(hspace: number, hfont: number): number {
        const tool = this.getTFont(hspace, hfont);
        return typeof tool !== "undefined" ? tool.style() : 0;
    }
    stratum_setFontName2d(hspace: number, hfont: number, fontName: string): NumBool {
        const tool = this.getTFont(hspace, hfont);
        return typeof tool !== "undefined" ? tool.setName(fontName) : 0;
    }
    stratum_setFontSize2d(hspace: number, hfont: number, size: number): NumBool {
        const tool = this.getTFont(hspace, hfont);
        return typeof tool !== "undefined" ? tool.setSize(size) : 0;
    }
    stratum_setFontStyle2d(hspace: number, hfont: number, flags: number): NumBool {
        const tool = this.getTFont(hspace, hfont);
        return typeof tool !== "undefined" ? tool.setStyle(flags) : 0;
    }

    // Окна
    stratum_isWindowExist(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? 1 : 0;
    }
    stratum_getWindowSpace(wname: string): number {
        const handle = this.wnameToHspace.get(wname);
        return typeof handle !== "undefined" ? handle : 0;
    }
    stratum_getWindowProp(wname: string, prop: string): string {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.getProp(prop) : "";
    }
    stratum_getWindowOrgX(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.originX() : 0;
    }
    stratum_getWindowOrgY(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.originY() : 0;
    }
    stratum_setWindowOrg(wname: string, orgX: number, orgY: number): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.setOrigin(orgX, orgY) : 0;
    }
    stratum_getWindowWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.width() : 0;
    }
    stratum_getWindowHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.height() : 0;
    }
    stratum_getClientWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.width() : 0;
    }
    stratum_getClientHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.height() : 0;
    }
    stratum_setClientSize(wname: string, width: number, height: number): NumBool {
        const wnd = this.windows.get(wname);
        return typeof wnd !== "undefined" ? wnd.setSize(width, height) : 0;
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
        this.windows.delete(wname);

        const handle = this.wnameToHspace.get(wname);
        if (typeof handle !== "undefined") {
            this.wnameToHspace.delete(wname);
            this.hspaceToWname.delete(handle);
            const scene = this.scenes.get(handle);
            this.scenes.delete(handle);
            if (scene === this.targetScene) {
                this.targetScene?.releaseCapture();
                this.targetScene = null;
            }
        }
        return 1;
    }

    // Заглушки
    stratum_setWindowTransparent(): NumBool {
        return 1;
    }
    stratum_setWindowTransparentColor(): NumBool {
        return 1;
    }
    stratum_setWindowOwner(): NumBool {
        return 1;
    }

    // Системное
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
                this.unsub.add(Constant[code]);
                if (this.unsub.size > this.unsubS) {
                    this.unsubS = this.unsub.size;
                    console.warn(`Подписка на ${Constant[code]} не реализована`);
                }
                break;
        }
    }
    private unsub = new Set<string>();
    private unsubS = 0;

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
                wnd.offClose(sub);
                break;
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
            default:
                break;
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

    // Эти методы вызываются из Player, т.к. он отвечает за загрузку файлов.
    openWindow(wname: string, attribute: string, vdr?: VectorDrawing, prj?: Project): number {
        const existHandle = this.wnameToHspace.get(wname);
        if (typeof existHandle !== "undefined") return existHandle;

        const handle = HandleMap.getFreeHandle(this.scenes);
        const wnd = new SceneWindow({
            handle,
            wname,
            attribute,
            host: this.host,
            vdr,
            disableResize: prj?.options.disableWindowResize,
        });
        wnd["wnd"].on("closed", () => {
            this.stratum_closeWindow(wname);
            wnd.dispatchClose();
        });

        this.hspaceToWname.set(handle, wname);
        this.wnameToHspace.set(wname, handle);
        this.scenes.set(handle, wnd.scene);
        this.windows.set(wname, wnd);

        this.computer.run(() => this.redrawAll());
        return handle;
    }
    closeAllWindows(prj?: Project) {
        // Как вариант, можно помечать открываемые окна объектом проекта
        // который был установлен во время открытия окна.
        // Тогда можно определить, кого надо закрывать.
        this.windows.forEach((w) => w.close());
        this.hspaceToWname.clear();
        this.wnameToHspace.clear();
        this.scenes.clear();
        this.windows.clear();
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

    private redrawAll() {
        const wins = this.windows;
        wins.forEach((v) => v.redraw());
        return wins.size > 0;
    }
}
