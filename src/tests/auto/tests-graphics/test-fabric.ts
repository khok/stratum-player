import { strictEqual } from "assert";
import { createComposedScheme } from "/common/createComposedScheme";
import { VirtualFileSystem } from "/common/virtualFileSystem";
import { GraphicsManager } from "/graphics/manager/graphicsManager";
import { BmpToolFactory } from "/graphics/scene";
import { SingleCanvasWindowSystem } from "/graphics/windowSystems";
import { Project } from "/project/project";

(async function () {
    const fs = await VirtualFileSystem.new([{ source: "/test_projects/balls.zip" }, { source: "/data/library.zip" }]);
    const prj = await Project.open(fs, { addSearchDirs: ["library/"] });
    const classes = prj.classes;
    const classname = "WorkSpace";
    const cl = classes.get(classname.toLowerCase())!;
    const vdr = createComposedScheme(cl.scheme!, cl.children!, classes);
    strictEqual(vdr.source!.origin, "class");
    strictEqual(vdr.source!.name, classname);
    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ws = new SingleCanvasWindowSystem({ globalCanvas });
    const graphics = new GraphicsManager(ws);

    const wname = "Test Window";
    const spaceHandle = graphics.openSchemeWindow(wname, "", vdr);
    strictEqual(document.title, wname);

    const space = graphics.getSpace(spaceHandle)!;
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
    console.log("Fabric test 1/2 completed.");

    await new Promise((res) => setTimeout(res, 1500));

    space.setOrigin(30, 30);
    strictEqual(space.getObjectFromPoint(40, 40), undefined);
    space.getObject(33)!.setPosition(32, 32);
    strictEqual(space.getObjectFromPoint(40, 40)!.handle, 34);
    ws.redrawWindows();
    console.log("Fabric test 2/2 completed.");
})();
