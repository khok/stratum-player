import { Project, SmoothExecutor, WindowHost } from "stratum/api";
import { Base64Image } from "stratum/fileFormats/bmp";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { EventCode, EventDispatcher, EventSubscriber, GraphicsFunctions, NumBool } from "stratum/translator";
import { Scene } from "./scene";
import { SceneWindow } from "./sceneWindow";

/**
 * Сделать нормально
 */
export const SYSTEM_KEYS = new Uint8Array(256);

export class GraphicsManager implements GraphicsFunctions, EventDispatcher {
    private hspaceToWname = new Map<number, string>();
    private wnameToHspace = new Map<string, number>();
    private scenes = new Map<number, Scene>();
    private windows = new Map<string, SceneWindow>();
    private computer = new SmoothExecutor();

    constructor(public host: WindowHost) {}

    getAsyncKeyState(vkey: number): number {
        return SYSTEM_KEYS[vkey] > 0 ? 1 : 0;
    }

    // Пространства
    getWindowName(hspace: number): string {
        const name = this.hspaceToWname.get(hspace);
        return name !== undefined ? name : "";
    }
    getSpaceOrg2dx(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.originX : 0;
    }
    getSpaceOrg2dy(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.originY : 0;
    }
    setSpaceOrg2d(hspace: number, x: number, y: number): NumBool {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.setOrigin(x, y) : 0;
    }
    getScaleSpace2d(hspace: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.scale : 0;
    }
    setScaleSpace2d(hspace: number, ms: number): NumBool {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.setScale(ms) : 0;
    }

    // Общие операции над объектами пространства
    getObjectOrg2dx(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        // FIXME: переим. positionX в originX
        return obj !== undefined ? obj.positionX : 0;
    }
    getObjectOrg2dy(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        // FIXME: переим. positionY в originY
        return obj !== undefined ? obj.positionY : 0;
    }
    setObjectOrg2d(hspace: number, hobject: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.setPosition(x, y) : 0;
    }
    rotateObject2d(hspace: number, hobject: number, centerX: number, centerY: number, angle: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.rotate(centerX, centerY, angle) : 0;
    }
    getActualWidth2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        // FIXME: надо возвращать obj.actualWidth
        return obj !== undefined ? obj.width : 0;
    }
    getActualHeight2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        // FIXME: надо возвращать obj.actualHeight
        return obj !== undefined ? obj.height : 0;
    }
    getObjectWidth2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.width : 0;
    }
    getObjectHeight2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.height : 0;
    }
    setObjectSize2d(hspace: number, hobject: number, sizeX: number, sizeY: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.setSize(sizeX, sizeY) : 0;
    }
    getZOrder2d(hspace: number, hobject: number): number {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.zOrder : 0;
    }
    setZOrder2d(hspace: number, hobject: number, zOrder: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.setZorder(zOrder) : 0;
    }
    setObjectName2d(hspace: number, hobject: number, name: string): NumBool {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.setName(name) : 0;
    }
    setShowObject2d(hspace: number, hobject: number, visible: number): NumBool {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined ? obj.setVisibility(visible) : 0;
    }
    objectToTop2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.moveObjectToTop(hobject) : 0;
    }
    deleteObject2d(hspace: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.deleteObject(hobject) : 0;
    }

    // Группы
    createGroup2d(hspace: number, ...hobject: number[]): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.createGroup(hobject) : 0;
    }
    getGroupItem2d(hspace: number, hgroup: number, index: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.getGroupItem2d(hgroup, index) : 0;
    }
    delGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.delGroupItem2d(hgroup, hobject) : 0;
    }
    getObject2dByName(hspace: number, hgroup: number, name: string): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.getObject2dByName(hgroup, name) : 0;
    }
    getObjectParent2d(hspace: number, hobject: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.getObjectParent2d(hobject) : 0;
    }

    // Прочее
    getObjectFromPoint2d(hspace: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.getObjectFromPoint2d(x, y) : 0;
    }
    isObjectsIntersect2d(hspace: number, obj1: number, obj2: number, flags: number): NumBool {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.isIntersect(obj1, obj2) : 0;
    }

    // Polyline
    createPolyLine2d(hspace: number, hpen: number, hbrush: number, ...coords: number[]): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.createLine(hpen, hbrush, coords) : 0;
    }
    createLine2d(hspace: number, hpen: number, hbrush: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.createLine(hpen, hbrush, [x, y]) : 0;
    }
    addPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hline);
        return obj !== undefined && obj.type === "otLINE2D" ? obj.addPoint(index, x, y) : 0;
    }
    getVectorPoint2dx(hspace: number, hline: number, index: number): number {
        const obj = this.getObject(hspace, hline);
        return obj !== undefined && obj.type === "otLINE2D" ? obj.pointX(index) : 0;
    }
    getVectorPoint2dy(hspace: number, hline: number, index: number): number {
        const obj = this.getObject(hspace, hline);
        return obj !== undefined && obj.type === "otLINE2D" ? obj.pointY(index) : 0;
    }
    setVectorPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool {
        const obj = this.getObject(hspace, hline);
        return obj !== undefined && obj.type === "otLINE2D" ? obj.setPointXY(index, x, y) : 0;
    }
    getPenObject2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return obj !== undefined && obj.type === "otLINE2D" ? obj.hpen : 0;
    }
    getBrushObject2d(hspace: number, hline: number): number {
        const obj = this.getObject(hspace, hline);
        return obj !== undefined && obj.type === "otLINE2D" ? obj.hbrush : 0;
    }

    // Объект Текст
    createRasterText2D(hspace: number, htext: number, x: number, y: number, angle: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.createText(htext, x, y, angle) : 0;
    }
    getTextObject2d(hspace: number, hojbect: number): number {
        const obj = this.getObject(hspace, hojbect);
        return obj !== undefined && obj.type === "otTEXT2D" ? obj.textTool.handle : 0;
    }

    // Объект Контрол
    getControlText2d(hspace: number, hcontrol: number, begin?: number, length?: number): string {
        const obj = this.getObject(hspace, hcontrol);
        if (obj === undefined || obj.type !== "otCONTROL2D") return "";

        if (begin === undefined || length === undefined) return obj.text;
        return obj.text.slice(begin, begin + length);
    }

    setControlText2d(hspace: number, hcontrol: number, text: string): NumBool {
        const obj = this.getObject(hspace, hcontrol);
        return obj !== undefined && obj.type === "otCONTROL2D" ? obj.setText(text) : 0;
    }

    // Объект битмап
    createBitmap2d(hspace: number, hdib: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.createBitmap(x, y, hdib, false) : 0;
    }
    createDoubleBitmap2D(hspace: number, hdib: number, x: number, y: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.createBitmap(x, y, hdib, true) : 0;
    }
    setBitmapSrcRect2d(hspace: number, hobject: number, x: number, y: number, width: number, height: number): number {
        const obj = this.getObject(hspace, hobject);
        return obj !== undefined && (obj.type === "otBITMAP2D" || obj.type === "otDOUBLEBITMAP2D") ? obj.setRect(x, y, width, height) : 0;
    }

    // Инструмент битмап

    // Инструмент Pen
    createPen2d(hspace: number, style: number, width: number, color: number, rop2: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createPen(style, width, color, rop2) : 0;
    }
    getPenStyle2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.style2 : 0;
    }
    setPenStyle2d(hspace: number, hpen: number, style: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.setStyle(style) : 0;
    }
    getPenWidth2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.width : 0;
    }
    setPenWidth2d(hspace: number, hpen: number, width: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.setWidth(width) : 0;
    }
    getPenColor2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.color : 0;
    }
    setPenColor2d(hspace: number, hpen: number, color: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.setColor(color) : 0;
    }
    getPenRop2d(hspace: number, hpen: number): number {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.rop : 0;
    }
    setPenRop2d(hspace: number, hpen: number, rop: number): NumBool {
        const tool = this.getTPen(hspace, hpen);
        return tool !== undefined ? tool.setRop(rop) : 0;
    }

    // Инструмент Brush
    createBrush2d(hspace: number, style: number, hatch: number, color: number, hdib: number, type: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createBrush(style, hatch, color, hdib, type) : 0;
    }
    getBrushStyle2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.style : 0;
    }
    setBrushStyle2d(hspace: number, hbrush: number, style: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.setStyle(style) : 0;
    }
    getBrushHatch2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.hatch : 0;
    }
    setBrushHatch2d(hspace: number, hbrush: number, hatch: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.setHatch(hatch) : 0;
    }
    getBrushColor2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.color : 0;
    }
    setBrushColor2d(hspace: number, hbrush: number, color: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.setColor(color) : 0;
    }
    getBrushRop2d(hspace: number, hbrush: number): number {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.rop : 0;
    }
    setBrushRop2d(hspace: number, hbrush: number, rop: number): NumBool {
        const tool = this.getTBrush(hspace, hbrush);
        return tool !== undefined ? tool.setRop(rop) : 0;
    }

    // Инструмент Текст
    createText2D(hspace: number, hfont: number, hstring: number, fgColor: number, bgColor: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createText(hfont, hstring, fgColor, bgColor) : 0;
    }
    getTextCount2d(hspace: number, htext: number): number {
        const tool = this.getTText(hspace, htext);
        return tool !== undefined ? tool.textCount : 0;
    }
    getTextFont2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return tool !== undefined ? tool.getFontHandle(index) : 0;
    }
    getTextString2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return tool !== undefined ? tool.getStringHandle(index) : 0;
    }
    getTextFgColor2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return tool !== undefined ? tool.getFgColor(index) : 0;
    }
    getTextBkColor2d(hspace: number, htext: number, index: number = 0): number {
        const tool = this.getTText(hspace, htext);
        return tool !== undefined ? tool.getBgColor(index) : 0;
    }

    setText2D(hspace: number, htext: number, /*          */ hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    setText2D(hspace: number, htext: number, index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    setText2D(hspace: number, htext: number, a1: number, a2: number, a3: number, a4: number, a5?: number): NumBool {
        const tool = this.getTText(hspace, htext);
        if (tool === undefined) return 0;

        const index = a5 !== undefined ? a1 : 0;
        const hfont = a5 !== undefined ? a2 : a1;
        const hstring = a5 !== undefined ? a3 : a2;
        const fgColor = a5 !== undefined ? a4 : a3;
        const bgColor = a5 !== undefined ? a5 : a4;

        return tool.updateVals2(index, this.getTFont(hspace, hfont), this.getTString(hspace, hstring), fgColor, bgColor);
    }

    // Инструмент Строка
    createString2D(hspace: number, value: string): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createString(value) : 0;
    }
    getstring2d(hspace: number, hstring: number): string {
        const tool = this.getTString(hspace, hstring);
        return tool !== undefined ? tool.text : "";
    }
    setString2d(hspace: number, hstring: number, value: string): NumBool {
        const tool = this.getTString(hspace, hstring);
        return tool !== undefined ? tool.setText(value) : 0;
    }

    // Инструмент Шрифт
    createFont2D(hspace: number, fontName: string, height: number, flags: number): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createFont(fontName, height, flags) : 0;
    }

    // Окна
    isWindowExist(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? 1 : 0;
    }
    getWindowSpace(wname: string): number {
        const handle = this.wnameToHspace.get(wname);
        return handle !== undefined ? handle : 0;
    }
    getWindowProp(wname: string, prop: string): string {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.getProp(prop) : "";
    }
    getWindowOrgX(wname: string): number {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.originX : 0;
    }
    getWindowOrgY(wname: string): number {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.originY : 0;
    }
    setWindowOrg(wname: string, orgX: number, orgY: number): NumBool {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.setOrigin(orgX, orgY) : 0;
    }
    getWindowWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.width : 0;
    }
    getWindowHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.height : 0;
    }
    getClientWidth(wname: string): number {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.width : 0;
    }
    getClientHeight(wname: string): number {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.height : 0;
    }
    setClientSize(wname: string, width: number, height: number): NumBool {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.setSize(width, height) : 0;
    }
    bringWindowToTop(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.toTop() : 0;
    }
    showWindow(wname: string, flag: number): NumBool {
        const wnd = this.windows.get(wname);
        return wnd !== undefined ? wnd.setAttrib(flag) : 0;
    }
    closeWindow(wname: string): NumBool {
        const wnd = this.windows.get(wname);
        if (wnd === undefined) return 0;

        wnd.close();
        this.windows.delete(wname);

        const handle = this.wnameToHspace.get(wname);
        if (handle !== undefined) {
            this.wnameToHspace.delete(wname);
            this.hspaceToWname.delete(handle);
            this.scenes.delete(handle);
        }
        return 1;
    }

    // Заглушки
    setWindowTransparent(): NumBool {
        return 1;
    }
    setWindowTransparentColor(): NumBool {
        return 1;
    }
    setWindowOwner(): NumBool {
        return 1;
    }

    // Системное
    getScreenWidth(): number {
        return screen.width;
    }
    getScreenHeight(): number {
        return screen.height;
    }
    getWorkAreaX(): number {
        return 0;
    }
    getWorkAreaY(): number {
        return 0;
    }
    getWorkAreaWidth(): number {
        return this.host.width;
    }
    getWorkAreaHeight(): number {
        return this.host.height;
    }

    // Методы EventDispatcher
    subscribe(sub: EventSubscriber, wnameOrHspace: string | number, obj2d: number, code: EventCode) {
        const nm = typeof wnameOrHspace === "string" ? wnameOrHspace : this.hspaceToWname.get(wnameOrHspace);
        if (!nm) return;
        const wnd = this.windows.get(nm);
        if (wnd === undefined) return;

        switch (code) {
            case EventCode.WM_CONTROLNOTIFY: {
                const obj = wnd.scene.objects.get(obj2d);
                if (obj === undefined || obj.type !== "otCONTROL2D") return;
                obj.renderable.onChange(sub);
                break;
            }
            case EventCode.WM_SIZE:
                wnd.onResize(sub);
                break;
            case EventCode.WM_SPACEDONE:
                wnd.onClose(sub);
                break;
            case EventCode.WM_MOUSEMOVE:
            case EventCode.WM_LBUTTONDOWN:
            case EventCode.WM_LBUTTONUP:
            case EventCode.WM_LBUTTONDBLCLK:
            case EventCode.WM_RBUTTONDOWN:
            case EventCode.WM_RBUTTONUP:
            case EventCode.WM_RBUTTONDBLCLK:
            case EventCode.WM_MBUTTONDOWN:
            case EventCode.WM_MBUTTONUP:
            case EventCode.WM_MBUTTONDBLCLK:
            case EventCode.WM_ALLMOUSEMESSAGE: {
                wnd.onMouse(sub, code, obj2d);
                break;
            }
            default:
                // console.log(EventCode[message]);
                break;
        }
    }

    unsubscribe(sub: EventSubscriber, wnameOrHspace: string | number, code: EventCode) {
        const nm = typeof wnameOrHspace === "string" ? wnameOrHspace : this.hspaceToWname.get(wnameOrHspace);
        if (!nm) return;
        const wnd = this.windows.get(nm);
        if (wnd === undefined) return;

        switch (code) {
            // case EventCode.WM_CONTROLNOTIFY: {
            //     const obj = wnd.scene.objects.get(obj2d);
            //     if (obj === undefined || obj.type !== "otCONTROL2D") return;
            //     obj.renderable.offChange(sub);
            //     break;
            // }
            case EventCode.WM_SIZE:
                wnd.offResize(sub);
                break;
            case EventCode.WM_SPACEDONE:
                wnd.offClose(sub);
                break;
            case EventCode.WM_MOUSEMOVE:
            case EventCode.WM_LBUTTONDOWN:
            case EventCode.WM_LBUTTONUP:
            case EventCode.WM_LBUTTONDBLCLK:
            case EventCode.WM_RBUTTONDOWN:
            case EventCode.WM_RBUTTONUP:
            case EventCode.WM_RBUTTONDBLCLK:
            case EventCode.WM_MBUTTONDOWN:
            case EventCode.WM_MBUTTONUP:
            case EventCode.WM_MBUTTONDBLCLK:
            case EventCode.WM_ALLMOUSEMESSAGE: {
                wnd.offMouse(sub, code);
                break;
            }
            default:
                // console.log(EventCode[message]);
                break;
        }
    }

    // Эти методы вызываются из Player, т.к. он отвечает за загрузку файлов.
    openWindow(wname: string, attribute: string, vdr?: VectorDrawing, prj?: Project): number {
        const existHandle = this.wnameToHspace.get(wname);
        if (existHandle !== undefined) return existHandle;

        const handle = HandleMap.getFreeHandle(this.scenes);
        const wnd = new SceneWindow({
            handle,
            wname,
            attribute,
            host: this.host,
            vdr,
            disableResize: prj?.options.disableWindowResize,
        });

        this.hspaceToWname.set(handle, wname);
        this.wnameToHspace.set(wname, handle);
        this.scenes.set(handle, wnd.scene);
        this.windows.set(wname, wnd);

        this.computer.run(() => this.redrawAll());
        return handle;
    }
    insertVDR(hspace: number, x: number, y: number, flags: number, vdr: VectorDrawing): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.insertVectorDrawing(x, y, flags, vdr) : 0;
    }
    createBitmap(hspace: number, bmp: Base64Image): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createBitmap(bmp) : 0;
    }
    createDoubleBitmap(hspace: number, dbm: Base64Image): number {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.createDoubleBitmap(dbm) : 0;
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
        return scene !== undefined ? scene.objects.get(hobject) : undefined;
    }
    private getTPen(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.pens.get(htool) : undefined;
    }
    private getTBrush(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.brushes.get(htool) : undefined;
    }
    private getTText(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.texts.get(htool) : undefined;
    }
    private getTString(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.strings.get(htool) : undefined;
    }
    private getTFont(hspace: number, htool: number) {
        const scene = this.scenes.get(hspace);
        return scene !== undefined ? scene.tools.fonts.get(htool) : undefined;
    }

    private redrawAll() {
        const wins = this.windows;
        wins.forEach((v) => v.redraw());
        return wins.size > 0;
    }
}
