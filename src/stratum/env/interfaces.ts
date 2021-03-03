import { VectorDrawing } from "stratum/fileFormats/vdr";
import { EventSubscriber, NumBool } from ".";

export namespace Env {
    export interface Scene {
        readonly objects: ReadonlyMap<number, SceneObject>;
        readonly pens: ReadonlyMap<number, PenTool>;
        readonly brushes: ReadonlyMap<number, BrushTool>;
        readonly dibs: ReadonlyMap<number, DIBTool>;
        // readonly doubleDibs: ReadonlyMap<number, DIBTool>;
        readonly texts: ReadonlyMap<number, TextTool>;
        readonly strings: ReadonlyMap<number, StringTool>;
        readonly fonts: ReadonlyMap<number, FontTool>;

        originX(): number;
        originY(): number;
        setOrigin(x: number, y: number): NumBool;

        scale(): number;
        setScale(ms: number): NumBool;

        createLine(coords: number[], hpen: number, hbrush: number): number;
        createBitmap(x: number, y: number, hdib: number, isDouble: boolean): number;
        createText(x: number, y: number, angle: number, htext: number): number;
        createGroup(hobject: number[]): number;
        insertVectorDrawing(x: number, y: number, flags: number, vdr: VectorDrawing): number;
        deleteObject(hobject: number): NumBool;

        setObjectName(hobject: number, name: string): NumBool;
        getObjectZOrder(hobject: number): number;
        setObjectZOrder(hobject: number, zOrder: number): NumBool;
        moveObjectToTop(hobject: number): NumBool;
        moveObjectToBottom(hobject: number): NumBool;

        getObject2dByName(hgroup: number, name: string): number;
        deleteGroup2d(hgroup: number): NumBool;
        getObjectFromPoint2d(x: number, y: number): number;

        isIntersect(obj1: number, obj2: number): NumBool;

        createPenTool(style: number, width: number, color: number, rop2: number): number;
        createBrushTool(style: number, hatch: number, color: number, dibHandle: number, rop2: number): number;
        createDIBTool(img: HTMLCanvasElement): number;
        createDoubleDIBTool(img: HTMLCanvasElement): number;
        createStringTool(value: string): number;
        createFontTool(fontName: string, height: number, flags: number): number;
        createTextTool(hfont: number, hstring: number, fgColor: number, bgColor: number): number;

        setCapture(sub: EventSubscriber): void;
        releaseCapture(): void;
    }

    export interface SceneObject {
        parentHandle(): number;

        originX(): number;
        originY(): number;
        setOrigin(x: number, y: number): NumBool;
        width(): number;
        actualWidth(): number;
        height(): number;
        actualHeight(): number;
        setSize(sizeX: number, sizeY: number): NumBool;

        angle(): number;
        rotate(centerX: number, centerY: number, angle: number): NumBool;

        setShow(visible: number): NumBool;

        // Lines
        addPoint(index: number, x: number, y: number): NumBool;
        deletePoint(index: number): NumBool;
        pointOriginY(index: number): number;
        pointOriginX(index: number): number;
        setPointOrigin(index: number, x: number, y: number): NumBool;
        penHandle(): number;
        brushHandle(): number;

        // Text
        textToolHandle(): number;
        controlText(): string;
        setControlText(text: string): NumBool;

        // Bitmaps
        setBitmapRect(x: number, y: number, width: number, height: number): NumBool;
        dibHandle(): number;
        doubleDIBHandle(): number;

        // Groups
        itemHandle(index: number): number;
        addItem(itemHandle: number): NumBool;
        deleteItem(itemHandle: number): NumBool;
    }

    export interface PenTool {
        style(): number;
        setStyle(style: number): NumBool;
        width(): number;
        setWidth(width: number): NumBool;
        color(): number;
        setColor(color: number): NumBool;
        rop(): number;
        setRop(rop: number): NumBool;
    }

    export interface BrushTool {
        style(): number;
        setStyle(style: number): NumBool;
        hatch(): number;
        setHatch(hatch: number): NumBool;
        color(): number;
        setColor(color: number): NumBool;
        rop(): number;
        setRop(rop: number): NumBool;
    }

    export interface DIBTool {
        getPixel(x: number, y: number): number;
        setPixel(x: number, y: number, colorref: number): NumBool;
    }

    export interface TextTool {
        textCount(): number;
        fontHandle(index: number): number;
        stringHandle(index: number): number;
        fgColor(index: number): number;
        bgColor(index: number): number;
        setValues(index: number, fontHandle: number, stringHandle: number, fgColor: number, bgColor: number): NumBool;
    }
    export interface StringTool {
        text(): string;
        setText(value: string): NumBool;
    }
    export interface FontTool {
        name(): string;
        setName(fontName: string): NumBool;
        size(): number;
        setSize(size: number): NumBool;
        style(): number;
        setStyle(flags: number): NumBool;
    }
}
