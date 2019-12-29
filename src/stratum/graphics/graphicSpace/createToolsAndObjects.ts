import { ElementData, VectorDrawToolsData, Element2dData } from "data-types-graphics";
import { VisualFactory } from "scene-types";
import { GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import { BrushTool, PenTool, BitmapTool, DoubleBitmapTool } from "./tools";
import { ImageResolver } from "internal-graphic-types";
import { GraphicObject, GroupObject, LineObject, BitmapObject, DoubleBitmapObject, ControlObject } from "./objects";

// function assemblyText(
//     textHandle: number,
//     fonts: HandleMap<FontTool>,
//     strings: HandleMap<string>,
//     texts: HandleMap<TextDataTool>
// ) {
//     const textData = texts.get(textHandle)!;
//     let res = "";
//     let fontSizeSum = 0;
//     for (const { fontHandle, stringHandle } of textData) {
//         const font = fonts.get(fontHandle)!;
//         fontSizeSum += font.fontSize;
//         res += strings.get(stringHandle)!;
//     }
//     return new fabric.Text(res, { fontSize: fontSizeSum / textData.length / 1.55, fontFamily: "Arial" });
// }

export function createTools(tools: VectorDrawToolsData, imageLoader: ImageResolver): GraphicSpaceTools {
    const brushes = tools.brushTools && HandleMap.create(tools.brushTools.map(b => [b.handle, new BrushTool(b)]));
    const pens = tools.penTools && HandleMap.create(tools.penTools.map(p => [p.handle, new PenTool(p)]));
    const bitmaps =
        tools.bitmapTools && HandleMap.create(tools.bitmapTools.map(b => [b.handle, new BitmapTool(b, imageLoader)]));
    const doubleBitmaps =
        tools.doubleBitmapTools &&
        HandleMap.create(tools.doubleBitmapTools.map(b => [b.handle, new DoubleBitmapTool(b, imageLoader)]));
    return new GraphicSpaceTools({ brushes, pens, bitmaps, doubleBitmaps });
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
            throw Error("Текст не реализован");
        case "otCONTROL2D":
            return new ControlObject(data, tools, visualFactory);
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
