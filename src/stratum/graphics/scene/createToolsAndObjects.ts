import { GroupElement, VectorDrawingElement, VectorDrawingElement2d, VectorDrawingTools } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { BmpToolFactory } from ".";
import { RenderableFactory } from "./interfaces";
import { SceneBitmapObject, SceneControlObject, SceneGroupObject, SceneLineObject, SceneObject, SceneTextObject } from "./objects";
import { SceneTools } from "./sceneTools";
import { SceneBrushTool, SceneFontTool, ScenePenTool, SceneStringTool, SceneTextTool } from "./tools";

export function createTools(tools: VectorDrawingTools): SceneTools {
    const { bitmapTools, brushTools, doubleBitmapTools: dbmps, fontTools, penTools, stringTools, textTools } = tools;

    const bitmaps = bitmapTools && HandleMap.create(bitmapTools.map((b) => [b.handle, BmpToolFactory.loadFromParams(b)]));
    const brushes = brushTools && HandleMap.create(brushTools.map((b) => [b.handle, new SceneBrushTool(b, bitmaps)]));
    const doubleBitmaps = dbmps && HandleMap.create(dbmps.map((b) => [b.handle, BmpToolFactory.loadFromParams(b)]));
    const fonts = fontTools && HandleMap.create(fontTools.map((f) => [f.handle, new SceneFontTool(f)]));
    const pens = penTools && HandleMap.create(penTools.map((p) => [p.handle, new ScenePenTool(p)]));
    const strings = stringTools && HandleMap.create(stringTools.map((s) => [s.handle, new SceneStringTool(s)]));

    //prettier-ignore
    const texts = textTools && HandleMap.create(textTools.map((t) => {
        const tool = SceneTextTool.create(t, fonts!, strings!);
        if (!tool) throw Error(`Не удалось создать Текст #${t.handle} из-за отсутствующих инструментов.`);
        return [t.handle, tool];
    }));

    return new SceneTools({ bitmaps, brushes, doubleBitmaps, fonts, pens, strings, texts });
}

function create2dObject(data: VectorDrawingElement2d, renderableFactory: RenderableFactory, tools: SceneTools) {
    switch (data.type) {
        case "otLINE2D":
            return new SceneLineObject(data, renderableFactory, tools);
        case "otBITMAP2D":
        case "otDOUBLEBITMAP2D":
            return SceneBitmapObject.create(data, renderableFactory, tools);
        case "otTEXT2D":
            return SceneTextObject.create(data, renderableFactory, tools);
        case "otCONTROL2D":
            return new SceneControlObject(data, renderableFactory);
    }
}

export function createObjects(elements: VectorDrawingElement[], renderableFactory: RenderableFactory, tools: SceneTools, layers: number) {
    const allObjects = HandleMap.create<SceneObject>();

    const groups: { obj: SceneGroupObject; data: GroupElement }[] = [];

    for (const data of elements) {
        let obj: SceneObject | undefined;

        if (data.type === "otGROUP2D") {
            obj = new SceneGroupObject(data);
            groups.push({ obj, data });
        } else {
            obj = create2dObject(data, renderableFactory, tools);
            if (!obj) throw Error(`Не удалось создать ${data.type} #${data.handle} из-за отсутствующих инструментов.`);
            obj.setHiddenLayers(layers);
        }

        allObjects.set(data.handle, obj);
    }

    for (const { obj, data } of groups) {
        const children = data.childHandles.map((h) => {
            const child = allObjects.get(h);
            if (!child) throw Error(`Группа #${data.handle} ссылается на несуществующий объект #${h}`);
            if (child.parent) throw Error(`Группа #${data.handle} ссылается на объект #${h}, состоящий в другой группе`);
            return child;
        });
        obj.addItems(children);
    }

    return allObjects;
}
