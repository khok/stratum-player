import { Element2dData, ElementData, VectorDrawToolsData } from "data-types-graphics";
import { ImageResolver } from "internal-graphic-types";
import { VisualFactory } from "scene-types";
import { GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import {
    BitmapObject,
    ControlObject,
    DoubleBitmapObject,
    GraphicObject,
    GroupObject,
    LineObject,
    TextObject
} from "./objects";
import { BitmapTool, BrushTool, DoubleBitmapTool, PenTool, StringTool, TextTool, FontTool } from "./tools";

export function createTools(tools: VectorDrawToolsData, imageLoader: ImageResolver): GraphicSpaceTools {
    //prettier-ignore
    const bitmaps = HandleMap.create(tools.bitmapTools && tools.bitmapTools.map(bmpData => {
        const image = bmpData.type === "ttDIB2D" ? imageLoader.fromData(bmpData.image) : imageLoader.fromFile(bmpData.filename);
        return [bmpData.handle, new BitmapTool(image)];
    }));

    const brushes = tools.brushTools && HandleMap.create(tools.brushTools.map(b => [b.handle, new BrushTool(b)]));

    //prettier-ignore
    const doubleBitmaps = tools.doubleBitmapTools && HandleMap.create(tools.doubleBitmapTools.map(b => [b.handle, new DoubleBitmapTool(b, imageLoader)]));

    //prettier-ignore
    const fonts = tools.fontTools && HandleMap.create(tools.fontTools.map(f => [f.handle, new FontTool("Arial", f.fontSize, f.fontStyle)]));

    const pens = tools.penTools && HandleMap.create(tools.penTools.map(p => [p.handle, new PenTool(p.width, p.color)]));

    //prettier-ignore
    const strings = tools.stringTools && HandleMap.create(tools.stringTools.map(s => [s.handle, new StringTool(s.data)]));

    //prettier-ignore
    const texts = tools.textTools && HandleMap.create(tools.textTools.map(t => [t.handle, new TextTool( t.textCollection.map(tt => ({
            font: fonts!.get(tt.fontHandle)!,
            stringFragment: strings!.get(tt.stringHandle)!,
            foregroundColor: tt.ltFgColor,
            backgroundColor: tt.ltBgColor,
        })) )]));

    return new GraphicSpaceTools({ bitmaps, brushes, doubleBitmaps, fonts, pens, strings, texts, imageLoader });
}

export function create2dObject(data: Element2dData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
    switch (data.type) {
        case "otLINE2D":
            return new LineObject(data, tools, visualFactory);
        case "otBITMAP2D":
            return new BitmapObject(data, tools, visualFactory);
        case "otDOUBLEBITMAP2D":
            return new DoubleBitmapObject(data, tools, visualFactory);
        case "otTEXT2D":
            return new TextObject(data, tools, visualFactory);
        case "otCONTROL2D":
            return new ControlObject(data, visualFactory);
    }
}

export function createObjects(elements: ElementData[], tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
    const allObjects = HandleMap.create<GraphicObject>();

    const groups: { obj: GroupObject; handle: number; data: number[] }[] = [];
    for (const elementData of elements) {
        const { handle } = elementData;
        let obj: GraphicObject;
        if (elementData.type === "otGROUP2D") {
            obj = new GroupObject({ name: elementData.name });
            groups.push({ obj, handle, data: elementData.childHandles });
        } else {
            obj = create2dObject(elementData, tools, visualFactory);
        }
        allObjects.set(handle, obj);
    }

    for (const { obj, handle, data } of groups) {
        const childs = data.map(h => {
            const child = allObjects.get(h);
            if (!child) throw new StratumError(`Группа #${handle} ссылается на несуществующий объект #${h}`);
            if (child.parent)
                throw new StratumError(`Группа #${handle} ссылается на объект #${h}, уже состоящий в другой группе`);
            return child;
        });
        obj.addItems(childs.values());
    }

    return allObjects;
}
