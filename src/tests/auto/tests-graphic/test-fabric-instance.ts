import { equal } from "assert";
import { openZipFromUrl, readProjectData } from "~/fileReader/fileReaderHelpers";
import { BitmapToolFactory } from "~/graphics/graphicSpace/bitmapToolFactory";
import { GraphicSpace } from "~/graphics/graphicSpace/graphicSpace";
import { GroupObject } from "~/graphics/graphicSpace/objects";
import { GraphicSystem } from "~/graphics/graphicSystem";
import { EventDispatcher } from "~/helpers/eventDispatcher";
import { createComposedScheme } from "~/helpers/graphics";

(async function () {
    const zip = await openZipFromUrl(["/test_projects/balls.zip", "/data/library.zip"]);
    const { classesData } = await readProjectData(zip);
    const cl = classesData.get("WorkSpace")!;
    const cdata = cl.childInfo!;
    const oldvdr = cl.scheme!;
    const vdr = createComposedScheme(oldvdr, cdata, classesData);
    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const dispatcher = new EventDispatcher();
    const bmpFactory = new BitmapToolFactory({ iconsPath: "data/icons" });
    const gs = new GraphicSystem(bmpFactory, { globalCanvas, dispatcher });
    dispatcher.on("WINDOW_CREATED", (name) => (document.title = name));

    gs.createSchemeWindow("Test Window", "", ({ bmpFactory, scene }) =>
        GraphicSpace.fromVdr("WorkSpace", vdr, bmpFactory, scene)
    );
    equal(document.title, "Test Window");
    const space = gs.getSpace(1)!;
    bmpFactory.allImagesLoaded.then(() => space.scene.render());
    setTimeout(() => {
        space.setOrigin(30, 30);
        equal(space.getObjectFromPoint(40, 40), undefined);
        space.getObject(33)!.setPosition(32, 32);
        equal(space.getObjectFromPoint(40, 40)!.handle, 34);
        space.scene.render();
        console.log("graphic instance test 2/2 completed");
    }, 1500);
    space.scene.render();
    const elements = vdr.elements!;
    for (const elem of elements) {
        const obj = space.getObject(elem.handle)!;
        equal(obj.type, elem.type);
        equal(obj.handle, elem.handle);
        equal(obj.name, elem.name);
        if (elem.type === "otGROUP2D") {
            equal([...(obj as GroupObject).items].length, elem.childHandles.length);
            for (const child of elem.childHandles) {
                equal(space.getObject(child)!.parent, obj);
            }
        }
    }
    console.log("graphic instance test 1/2 completed");
})();
