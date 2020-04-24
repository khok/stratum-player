import { VisualFactory } from "scene-types";
import { Element2dData, ElementData, VectorDrawToolsData } from "vdr-types";
import { GraphicSpaceToolsState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { BitmapToolFactory } from "./bitmapToolFactory";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import { BitmapObject, ControlObject, GraphicObject, GroupObject, LineObject, TextObject } from "./objects";
import { BrushTool, FontTool, PenTool, StringTool, TextTool } from "./tools";

export function createTools(tools: VectorDrawToolsData, bmpFactory: BitmapToolFactory): GraphicSpaceTools {
    const { bitmapTools, brushTools, doubleBitmapTools: dbmps, fontTools, penTools, stringTools, textTools } = tools;

    const bitmaps = bitmapTools && HandleMap.create(bitmapTools.map((b) => [b.handle, bmpFactory.fromData(b)]));
    const brushes = brushTools && HandleMap.create(brushTools.map((b) => [b.handle, new BrushTool(b, bitmaps)]));
    const doubleBitmaps = dbmps && HandleMap.create(dbmps.map((b) => [b.handle, bmpFactory.fromData(b)]));
    const fonts = fontTools && HandleMap.create(fontTools.map((f) => [f.handle, new FontTool(f)]));
    const pens = penTools && HandleMap.create(penTools.map((p) => [p.handle, new PenTool(p)]));
    const strings = stringTools && HandleMap.create(stringTools.map((s) => [s.handle, new StringTool(s)]));
    const texts = textTools && HandleMap.create(textTools.map((t) => [t.handle, new TextTool(t, fonts!, strings!)]));

    return new GraphicSpaceTools({ bitmaps, brushes, doubleBitmaps, fonts, pens, strings, texts, bmpFactory });
}

function create2dObject(data: Element2dData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
    switch (data.type) {
        case "otLINE2D":
            return new LineObject(data, tools, visualFactory);
        case "otBITMAP2D":
            return new BitmapObject(data, tools, visualFactory);
        case "otDOUBLEBITMAP2D":
            return new BitmapObject(data, tools, visualFactory);
        case "otTEXT2D":
            return new TextObject(data, tools, visualFactory);
        case "otCONTROL2D":
            return new ControlObject(data, visualFactory);
    }
}

export function createObjects(
    elements: ElementData[],
    tools: GraphicSpaceToolsState,
    visualFactory: VisualFactory,
    layers: number
) {
    const allObjects = HandleMap.create<GraphicObject>();

    const groups: { obj: GroupObject; handle: number; data: number[] }[] = [];
    for (const elementData of elements) {
        const { handle } = elementData;
        let obj: GraphicObject;
        if (elementData.type === "otGROUP2D") {
            obj = new GroupObject(elementData);
            groups.push({ obj, handle, data: elementData.childHandles });
        } else {
            obj = create2dObject(elementData, tools, visualFactory);
            obj.setHiddenLayers(layers);
        }
        allObjects.set(handle, obj);
    }

    for (const { obj, handle, data } of groups) {
        const childs = data.map((h) => {
            const child = allObjects.get(h);
            if (!child) throw new StratumError(`Группа #${handle} ссылается на несуществующий объект #${h}`);
            if (child.parent)
                throw new StratumError(`Группа #${handle} ссылается на объект #${h}, уже состоящий в другой группе`);
            return child;
        });
        obj.addItems(childs);
    }

    return allObjects;
}
