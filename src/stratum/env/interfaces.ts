import { VectorDrawing } from "stratum/fileFormats/vdr";
import { DibToolImage } from "stratum/helpers/types";
import { VFSDir } from "stratum/vfs";
import { Constant, EventSubscriber, NumBool } from ".";

export namespace Env {
    export type Farr = Float64Array;

    export interface HyperTarget {
        hyperCall(mode: number, args: string[]): Promise<void>;
    }

    export interface Scene {
        readonly objects: ReadonlyMap<number, SceneObject>;
        readonly pens: ReadonlyMap<number, PenTool>;
        readonly brushes: ReadonlyMap<number, BrushTool>;
        readonly dibs: ReadonlyMap<number, DIBTool>;
        // readonly doubleDibs: ReadonlyMap<number, DIBTool>;
        readonly texts: ReadonlyMap<number, TextTool>;
        readonly strings: ReadonlyMap<number, StringTool>;
        readonly fonts: ReadonlyMap<number, FontTool>;

        clear(): NumBool;

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

        topObjectHandle(): number;
        bottomObjectHandle(): number;
        objectFromZOrder(zOrder: number): number;
        objectZOrder(hobject: number): number;
        lowerObjectHandle(hobject: number): number;
        upperObjectHandle(hobject: number): number;

        objectToBottom(hobject: number): NumBool;
        objectToTop(hobject: number): NumBool;
        swapObjects(hojb1: number, hojb2: number): NumBool;
        setObjectZOrder(hobject: number, zOrder: number): NumBool;

        deleteGroup2d(hgroup: number): NumBool;
        getObjectFromPoint2d(x: number, y: number): number;

        isIntersect(hobj1: number, hobj2: number): NumBool;

        objectName(hobject: number): string;
        setObjectName(hobject: number, name: string): NumBool;
        getObject2dByName(hgroup: number, name: string): number;

        createPenTool(style: number, width: number, color: number, rop2: number): number;
        createBrushTool(style: number, hatch: number, color: number, dibHandle: number, rop2: number): number;
        createDIBTool(img: DibToolImage): number;
        createDoubleDIBTool(img: DibToolImage): number;
        createStringTool(value: string): number;
        createFontTool(fontName: string, height: number, flags: number): number;
        createTextTool(hfont: number, hstring: number, fgColor: number, bgColor: number): number;

        setCapture(sub: EventSubscriber): void;
        releaseCapture(): void;

        onHyper(hyperTarget: HyperTarget): void;
        setHyper(hobject: number, mode: number, args: string[]): NumBool;
        tryHyper(x: number, y: number, hobject: number): void;

        brushHandle(): number;
        setBrush(hBrush: number): NumBool;
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

        setVisibility(visible: boolean): NumBool;

        // Lines
        addPoint(index: number, x: number, y: number): NumBool;
        deletePoint(index: number): NumBool;
        pointCount(): number;
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
        setDIB(hdib: number): NumBool;
        dibHandle(): number;
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

    export interface Window {
        id?: number;
        readonly scene: Env.Scene;
        onSpaceDone(sub: EventSubscriber): void;
        offSpaceDone(sub: EventSubscriber): void;
        onDestroy(sub: EventSubscriber): void;
        offDestroy(sub: EventSubscriber): void;
        onResize(sub: EventSubscriber): void;
        offResize(sub: EventSubscriber): void;
        onControlNotifty(sub: EventSubscriber, handle: number): void;
        offControlNotify(sub: EventSubscriber): void;
        onMouse(sub: EventSubscriber, code: Constant, handle: number): void;
        offMouse(sub: EventSubscriber, code: Constant): void;
        redraw(): void;

        close(): void;

        getProp(prop: string): string;

        width(): number;

        height(): number;

        setSize(width: number, height: number): NumBool;
        toTop(): NumBool;

        setAttrib(flag: number): NumBool;

        title(): string;

        setTitle(title: string): NumBool;
        originX(): number;
        originY(): number;
        setOrigin(x: number, y: number): NumBool;

        setTransparent(level: number): NumBool;
        setTransparentColor(cref: number): NumBool;
    }

    export interface WindowArgs {
        title: string;
        vdr?: VectorDrawing;
        disableResize?: boolean;
        noCaption?: boolean;
        onClosed?: Function;
    }

    // export interface WindowFactory {
    //     width(): number;
    //     height(): number;
    //     window(args: WindowArgs): Env.Window;
    // }

    export interface Project extends HyperTarget {
        readonly dir: VFSDir;
        compute(): boolean;
    }
}
