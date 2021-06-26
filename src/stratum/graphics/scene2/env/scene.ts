import { Constant } from "stratum/common/constant";
import { EventSubscriber, NumBool } from "stratum/common/types";
import { Hyperbase, VectorDrawing } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { Point2D } from "stratum/helpers/types";
import { BrushComponent } from "../components/brushComponent";
import { SceneOffsetComponent } from "../components/sceneOffsetComponent";
import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { ZOrderingComponent } from "../components/zOrderingComponent";
import { Entity } from "../entity";
import { EntityFactory } from "../entityFactory";
import { ToolManager } from "../toolManager";
import { Wnd } from "./wnd";

export class Scene {
    private _handle: number;
    private _wnd: Wnd;
    private scene: SceneOffsetComponent;

    private brushKeeper: ToolKeeperComponent<BrushComponent>;

    private tools: ToolManager;

    private entites: Map<number, Entity>;
    private zOrdering: ZOrderingComponent;
    entityFactory: EntityFactory;

    static lastPrimary(): number {
        throw new Error("Method not implemented.");
    }

    handle(): number {
        return this._handle;
    }
    wnd(): Wnd {
        return this._wnd;
    }

    originX(): number {
        return this.scene.x();
    }
    originY(): number {
        return this.scene.y();
    }
    setOrigin(x: number, y: number): NumBool {
        this.scene.set(x, y);
        return 1;
    }

    scale(): number {
        throw new Error("Method not implemented.");
    }
    setScale(ms: number): NumBool {
        throw new Error("Method not implemented.");
    }

    brushHandle(): number {
        return this.brushKeeper.tool()?.handle ?? 0;
    }
    setBrush(hBrush: number): NumBool {
        this.brushKeeper.setTool(this.tools.brush(hBrush));
        return 1;
    }

    setCapture(target: EventSubscriber) {
        throw new Error("Method not implemented.");
    }
    releaseCapture() {
        throw new Error("Method not implemented.");
    }

    // создание инструментов
    createPenTool(style: number, width: number, color: number, rop2: number): number {
        return this.tools.createPen(style, width, color, rop2).handle;
    }
    createBrushTool(style: number, hatch: number, color: number, hdib: number, type: number): number {
        return this.tools.createBrush(style, hatch, color, hdib, type).handle;
    }
    createDIBTool(img: DibToolImage): number {
        throw new Error("Method not implemented.");
    }
    createDoubleDIBTool(img: DibToolImage): number {
        throw new Error("Method not implemented.");
    }
    createFontTool(fontName: string, height: number, flags: number): number {
        throw new Error("Method not implemented.");
    }
    createStringTool(value: string): number {
        throw new Error("Method not implemented.");
    }
    createTextTool(hfont: number, hstring: number, fgColor: number, bgColor: number): number {
        throw new Error("Method not implemented.");
    }

    // создание объектов
    createLine(coords: number[], hpen: number, hbrush: number): number {
        const handle = HandleMap.getFreeHandle(this.entites);
        const line = this.entityFactory.line({
            type: "line",
            handle,
            coords,
            brushHandle: hbrush,
            penHandle: hpen,
            height: 0,
            width: 0,
            options: 0,
            originX: 0,
            originY: 0,
        });
        this.entites.set(handle, line);
        this.zOrdering.add(handle);
        return handle;
    }
    createText(x: number, y: number, angle: number, htext: number): number {
        throw new Error("Method not implemented.");
    }
    createBitmap(x: number, y: number, hdib: number, isDouble: boolean): number {
        throw new Error("Method not implemented.");
    }
    createControl(x: number, y: number, width: number, height: number, className: string, text: string, style: number): number {
        throw new Error("Method not implemented.");
    }
    createGroup(hobject: number[]): number {
        const handle = HandleMap.getFreeHandle(this.entites);
        const obj = this.entityFactory.group({
            type: "group",
            handle,
            childHandles: hobject,
            options: 0,
        });
        this.entites.set(handle, obj);
        return handle;
    }

    // Вставка пространства, копирование.
    insertVectorDrawing(x: number, y: number, flags: number, vdr: VectorDrawing): number {
        throw new Error("Method not implemented.");
    }
    copy(hobject: number): NumBool {
        throw new Error("Method not implemented.");
    }
    paste(x: number, y: number, flags: number): number {
        throw new Error("Method not implemented.");
    }

    // управление объектами
    objectType(hobject: number): number {
        throw new Error("Method not implemented.");
    }

    objectName(hobject: number): string {
        return this.entites.get(hobject)?.name ?? "";
    }
    setObjectName(hobject: number, name: string): NumBool {
        const obj = this.entites.get(hobject);
        if (!obj) return 0;
        obj.name = name;
        return 1;
    }

    objectX(hobject: number): number {
        return this.entites.get(hobject)?.transform.x() ?? 0;
    }
    objectY(hobject: number): number {
        return this.entites.get(hobject)?.transform.y() ?? 0;
    }
    setObjectXY(hobject: number, x: number, y: number): NumBool {
        const obj = this.entites.get(hobject);
        if (!obj) return 0;
        obj.transform.move(x, y);
        return 1;
    }

    objectWidth(hobject: number): number {
        return this.entites.get(hobject)?.bbox.width() ?? 0;
    }
    objectHeight(hobject: number): number {
        return this.entites.get(hobject)?.bbox.height() ?? 0;
    }
    setObjectSize(hobject: number, width: number, height: number): NumBool {
        const obj = this.entites.get(hobject);
        if (!obj) return 0;
        obj.transform.scale(width, height);
        return 1;
    }

    objectAngle(hobject: number): number {
        return this.entites.get(hobject)?.bbox.angle() ?? 0;
    }
    rotateObject(hobject: number, centerX: number, centerY: number, angle: number): NumBool {
        const obj = this.entites.get(hobject);
        if (!obj) return 0;
        obj.transform.rotate(centerX, centerY, angle);
        return 1;
    }

    objectParentHandle(hobject: number): number {
        throw new Error("Method not implemented.");
    }

    setObjectVisibility(hobject: number, visible: boolean): NumBool {
        throw new Error("Method not implemented.");
    }

    objectActualWidth(hobject: number): number {
        return this.entites.get(hobject)?.bbox.actualWidth() ?? 0;
    }
    objectActualHeight(hobject: number): number {
        return this.entites.get(hobject)?.bbox.actualHeight() ?? 0;
    }
    objectActualSize(hobject: number): Point2D {
        const obj = this.entites.get(hobject);
        if (!obj) return { x: 0, y: 0 };
        return { x: obj.bbox.actualWidth(), y: obj.bbox.actualHeight() };
    }

    setHyper(hobject: number, hyper: Hyperbase | null): NumBool {
        const obj = this.entites.get(hobject);
        if (!obj) return 0;
        obj.hyperbase = hyper;
        return 1;
    }

    // z order
    topObjectHandle(): number {
        const order = this.zOrdering.order();
        return order.length > 0 ? order[order.length - 1] : 0;
    }
    bottomObjectHandle(): number {
        const order = this.zOrdering.order();
        return order.length > 0 ? order[0] : 0;
    }
    objectFromZOrder(zOrder: number): number {
        const order = this.zOrdering.order();
        const realZ = zOrder - 1;
        if (realZ < 0 || realZ >= order.length) return 0;
        return order[realZ];
    }
    objectZOrder(hobject: number): number {
        return this.zOrdering.order().indexOf(hobject) + 1;
    }
    upperObjectHandle(hobject: number): number {
        const order = this.zOrdering.order();
        const i = order.indexOf(hobject);
        return i > -1 && i < order.length - 1 ? order[i + 1] : 0;
    }
    lowerObjectHandle(hobject: number): number {
        const order = this.zOrdering.order();
        const i = order.indexOf(hobject);
        return i > 0 ? order[i - 1] : 0;
    }
    objectToBottom(hobject: number): NumBool {
        const order = this.zOrdering.order();
        const newOrder = [hobject, ...order.filter((h) => h !== hobject)];
        this.zOrdering.setOrder(newOrder);
        return 1;
    }
    objectToTop(hobject: number): NumBool {
        const order = this.zOrdering.order();
        const newOrder = [...order.filter((h) => h !== hobject), hobject];
        this.zOrdering.setOrder(newOrder);
        return 1;
    }
    setObjectZOrder(hobject: number, zOrder: number): NumBool {
        const realZ = zOrder - 1;
        if (realZ < 0) return 0;

        const order = this.zOrdering.order();

        const newOrder: number[] = [];
        for (let i = 0; i < order.length; ++i) {
            if (i === realZ) newOrder.push(hobject);
            const cur = order[i];
            if (cur !== hobject) newOrder.push(cur);
        }
        if (realZ >= order.length) newOrder.push(hobject);

        this.zOrdering.setOrder(newOrder);
        return 1;
    }
    swapObjects(hobj1: number, hobj2: number): NumBool {
        const order = this.zOrdering.order();
        const i1 = order.indexOf(hobj1);
        if (i1 < 0) return 0;
        const i2 = order.indexOf(hobj2);
        if (i2 < 0) return 0;

        const newOrder = order.slice();
        newOrder[i1] = hobj2;
        newOrder[i2] = hobj1;
        this.zOrdering.setOrder(newOrder);
        return 1;
    }

    // прочее
    simulateHyperClick(x: number, y: number, hobject: number): void {
        throw new Error("Method not implemented.");
    }
    isIntersect(hobj1: number, hobj2: number): NumBool {
        const o1 = this.entites.get(hobj1)?.bbox;
        if (!o1) return 0;
        const o2 = this.entites.get(hobj2)?.bbox;
        if (!o2) return 0;
        return o1.maxX() >= o2.minX() && o2.maxX() >= o1.minX() && o1.maxY() >= o2.minY() && o2.maxY() >= o1.minY() ? 1 : 0;
    }
    getObject2dByName(hgroup: number, name: string): number {
        if (name === "") return 0;
        if (hgroup) {
            const gr = this.entites.get(hgroup)?.group;
            return gr ? gr.getChildByName(name) : 0;
        }
        for (const obj of this.objects.values()) if (obj.name === name) return obj.handle;
        return 0;
    }
    getObjectFromPoint2d(x: number, y: number): number {
        throw new Error("Method not implemented.");
    }
    deleteGroup2d(hgroup: number): NumBool {
        throw new Error("Method not implemented.");
    }
    deleteObject(hobject: number): NumBool {
        throw new Error("Method not implemented.");
    }
    next(hobject: number): number {
        throw new Error("Method not implemented.");
    }

    // линия
    linePointCount(hobject: number): number {
        return 0;
    }

    linePointOriginY(hline: number, index: number): number {
        return 0;
    }
    linePointOriginX(hline: number, index: number): number {
        return 0;
    }
    setLinePointOrigin(hline: number, index: number, x: number, y: number): NumBool {
        return 0;
    }

    addLinePoint(hline: number, index: number, x: number, y: number): NumBool {
        return 0;
    }
    deleteLinePoint(hline: number): NumBool {
        return 0;
    }

    linePenHandle(hline: number): number {
        return 0;
    }
    lineBrushHandle(hline: number): number {
        return 0;
    }

    // текст
    objectTextToolHandle(hobject: number): number {
        throw new Error("Method not implemented.");
    }

    // бмп
    setBmpRect(hobject: number, x: number, y: number, width: number, height: number): number {
        throw new Error("Method not implemented.");
    }
    bmpDibHandle(hobject: number): number {
        return 0;
    }
    bmpDoubleDIBHandle(hobject: number): number {
        return 0;
    }

    // Контрол
    controlText(hcontrol: number): string {
        return "";
    }
    setControlText(hobject: number, text: string): NumBool {
        return 0;
    }
    setControlFont(hobject: number, hfont: number): NumBool {
        return 0;
    }

    // группа
    groupItemCount(hgroup: number): number {
        return this.children.length;
    }
    groupItemHandle(hgroup: number, index: number): number {
        if (index < 0 || index >= this.children.length) return 0;
        return this.children[index].handle;
    }
    addItemToGroup(hgroup: number, itemHandle: number): NumBool {
        const child = this.scene.objects.get(itemHandle);
        if (!child || this.children.some((c) => c.handle === itemHandle)) return 0;
        child.onParentChanged(this);
        this.children.push(child);
        this.updateBorders();
        return 1;
    }
    deleteGroupItem(hgroup: number, itemHandle: number): NumBool {
        const child = this.children.find((c) => c.handle === itemHandle);
        if (!child) return 0;
        // этот метод должен вызывать removeChild
        child.onParentChanged(null);
        return 1;
    }

    // Карандаш
    penColor(hpen: number): number {
        throw new Error("Method not implemented.");
    }
    penRop(hpen: number): number {
        throw new Error("Method not implemented.");
    }
    penStyle(hpen: number): number {
        throw new Error("Method not implemented.");
    }
    penWidth(hpen: number): number {
        throw new Error("Method not implemented.");
    }
    setPenColor(hpen: number, color: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setPenRop(hpen: number, rop: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setPenStyle(hpen: number, style: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setPenWidth(hpen: number, width: number): NumBool {
        throw new Error("Method not implemented.");
    }

    // Кисть
    brushColor(hbrush: number): number {
        throw new Error("Method not implemented.");
    }
    brushRop(hbrush: number): number {
        throw new Error("Method not implemented.");
    }
    brushStyle(hbrush: number): number {
        throw new Error("Method not implemented.");
    }
    brushHatch(hbrush: number): number {
        throw new Error("Method not implemented.");
    }
    brushDibHandle(hbrush: number): number {
        throw new Error("Method not implemented.");
    }
    setBrushColor(hbrush: number, color: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setBrushRop(hbrush: number, rop: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setBrushStyle(hbrush: number, style: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setBrushHatch(hbrush: number, hatch: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setBrushDIB(hbrush: number, hdib: number): NumBool {
        throw new Error("Method not implemented.");
    }

    // Диб тул
    dibPixel2d(hdib: number, x: number, y: number): number {
        throw new Error("Method not implemented.");
    }
    setDibPixel2d(hdib: number, x: number, y: number, colorref: number): number {
        throw new Error("Method not implemented.");
    }

    // Шрифт
    fontName(hfont: number): string {
        throw new Error("Method not implemented.");
    }
    fontSize(hfont: number): number {
        throw new Error("Method not implemented.");
    }
    fontStyle(hfont: number): number {
        throw new Error("Method not implemented.");
    }
    setFontName(hfont: number, fontName: string): NumBool {
        throw new Error("Method not implemented.");
    }
    setFontSize(hfont: number, size: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setFontStyle(hfont: number, flags: number): NumBool {
        throw new Error("Method not implemented.");
    }

    // Строка
    stringText(hstring: number): string {
        throw new Error("Method not implemented.");
    }
    setStringText(hstring: number, value: string): NumBool {
        throw new Error("Method not implemented.");
    }

    // Текст тул
    textToolTextCount(htext: number): number {
        throw new Error("Method not implemented.");
    }
    textToolFontHandle(htext: number, index: number): number {
        throw new Error("Method not implemented.");
    }
    textToolStringHandle(htext: number, index: number): number {
        throw new Error("Method not implemented.");
    }
    textToolFgColor(htext: number, index: number): number {
        throw new Error("Method not implemented.");
    }
    textToolBgColor(htext: number, index: number): number {
        throw new Error("Method not implemented.");
    }
    setTextToolValues(htext: number, index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setTextToolFgColor(htext: number, index: number, fgColor: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setTextToolBgColor(htext: number, index: number, bgColor: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setTextToolFont(htext: number, index: number, hfont: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setTextToolString(htext: number, index: number, hstring: number): NumBool {
        throw new Error("Method not implemented.");
    }

    toolRefCount(type: number, toolHandle: number): number {
        throw new Error("Method not implemented.");
        switch (type) {
            case Constant.PEN2D:
                return this.getTPen(hspace, toolHandle)?.subCount() ?? 0;
            case Constant.BRUSH2D:
                return this.getTBrush(hspace, toolHandle)?.subCount() ?? 0;
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
    }
    deleteTool(type: number, toolHandle: number): number {
        throw new Error("Method not implemented.");
        switch (type) {
            case Constant.PEN2D:
                return scene.pens.delete(toolHandle) ? 1 : 0;
            case Constant.BRUSH2D:
                return scene.brushes.delete(toolHandle) ? 1 : 0;
            case Constant.DIB2D:
                return scene.dibs.delete(toolHandle) ? 1 : 0;
            case Constant.DOUBLEDIB2D:
                return scene.doubleDibs.delete(toolHandle) ? 1 : 0;
            case Constant.TEXT2D:
                return scene.texts.delete(toolHandle) ? 1 : 0;
            case Constant.STRING2D:
                return scene.strings.delete(toolHandle) ? 1 : 0;
            case Constant.FONT2D:
                return scene.fonts.delete(toolHandle) ? 1 : 0;
            case Constant.SPACE3D:
                throw Error("Не реализовано");
        }
    }
}
