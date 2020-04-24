import { VisualFactory } from "scene-types";
import { Element2dData, ElementData, GroupElementData, VectorDrawToolsData } from "vdr-types";
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

function create2dObject(data: Element2dData, visualFactory: VisualFactory, tools: GraphicSpaceTools) {
    switch (data.type) {
        case "otLINE2D":
            return new LineObject(data, visualFactory, tools);
        case "otBITMAP2D":
        case "otDOUBLEBITMAP2D":
            return new BitmapObject(data, visualFactory, tools);
        case "otTEXT2D":
            return new TextObject(data, visualFactory, tools);
        case "otCONTROL2D":
            return new ControlObject(data, visualFactory);
    }
}

export function createObjects(
    elements: ElementData[],
    visualFactory: VisualFactory,
    tools: GraphicSpaceTools,
    layers: number
) {
    const allObjects = HandleMap.create<GraphicObject>();

    const groups: { obj: GroupObject; data: GroupElementData }[] = [];
    for (const data of elements) {
        const { handle } = data;
        let obj: GraphicObject;
        if (data.type === "otGROUP2D") {
            obj = new GroupObject(data);
            groups.push({ obj, data });
        } else {
            obj = create2dObject(data, visualFactory, tools);
            obj.setHiddenLayers(layers);
        }
        allObjects.set(handle, obj);
    }

    for (const { obj, data } of groups) {
        const childs = data.childHandles.map((h) => {
            const child = allObjects.get(h);
            if (!child) throw new StratumError(`Группа #${data.handle} ссылается на несуществующий объект #${h}`);
            if (child.parent)
                throw new StratumError(`Группа #${data.handle} ссылается на объект #${h}, состоящий в другой группе`);
            return child;
        });
        obj.addItems(childs);
    }

    return allObjects;
}
