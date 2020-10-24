import { createComposedScheme } from "stratum/common/createComposedScheme";
import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { GraphicsManager } from "stratum/graphics/manager/graphicsManager";
import { WindowSystem } from "stratum/graphics/manager/interfaces";
import { BmpToolFactory, Scene } from "stratum/graphics/scene";
import { SingleCanvasWindowSystem } from "stratum/graphics/windowSystems";
import { Project } from "stratum/project/project";
const { strictEqual } = chai.assert;

describe("Сцена fabric рисуется корректно", () => {
    let space: Scene;
    let ws: WindowSystem;
    it("Шаг 1", async () => {
        const fs = await VirtualFileSystem.new([{ source: "/projects/balls.zip" }, { source: "/data/library.zip" }]);
        const prj = await Project.open(fs, { addSearchDirs: ["library/"] });
        const classes = prj.classes;
        const classname = "WorkSpace";
        const cl = classes.get(classname.toLowerCase())!;
        const vdr = createComposedScheme(cl.scheme!, cl.children!, classes);
        strictEqual(vdr.source!.origin, "class");
        strictEqual(vdr.source!.name, classname);
        const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
        ws = new SingleCanvasWindowSystem({ globalCanvas });
        const graphics = new GraphicsManager(ws);

        const wname = "Test Window";
        const spaceHandle = graphics.openSchemeWindow(wname, "", vdr);
        strictEqual(document.title, wname);

        space = graphics.getSpace(spaceHandle)!;
        BmpToolFactory.allImagesLoaded.then(() => ws.redrawWindows());

        ws.redrawWindows();
        const elements = vdr.elements!;
        for (const elem of elements) {
            const obj = space.getObject(elem.handle)!;
            strictEqual(obj.type, elem.type);
            strictEqual(obj.handle, elem.handle);
            strictEqual(obj.name, elem.name);
            if (elem.type === "otGROUP2D" && obj.type === "otGROUP2D") {
                strictEqual(obj.items.length, elem.childHandles.length);
                for (const child of elem.childHandles) {
                    strictEqual(space.getObject(child)!.parent, obj);
                }
            }
        }
    }).timeout(10000);
    it("Шаг 2", async () => {
        await new Promise((res) => setTimeout(res, 300));
        space.setOrigin(30, 30);
        strictEqual(space.getObjectFromPoint(40, 40), undefined);
        space.getObject(33)!.setPosition(32, 32);
        strictEqual(space.getObjectFromPoint(40, 40)!.handle, 34);
        ws.redrawWindows();
    }).timeout(10000);
});
