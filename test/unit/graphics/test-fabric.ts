import { unzip } from "stratum/api";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { HTMLWindowWrapper } from "stratum/graphics/html";
import { Scene } from "stratum/graphics/scene";
import { SimpleWindowManager } from "stratum/graphics/simpleWindowManager";
import { Player } from "stratum/player";
const { strictEqual } = chai.assert;

describe("Сцена fabric рисуется корректно", () => {
    let space: Scene;
    let windows: HTMLWindowWrapper;
    it("Шаг 1", async () => {
        const [a1, a2] = await Promise.all(
            ["/projects/test_balls.zip", "/data/library.zip"].map((s) =>
                fetch(s)
                    .then((r) => r.blob())
                    .then(unzip)
            )
        );
        const prj = (await a1.merge(a2).project({ additionalClassPaths: ["library"] })) as Player;

        const classes = prj.classes;
        const classname = "WorkSpace";
        const cl = classes.get(classname.toUpperCase())!;
        const vdr = createComposedScheme(cl.scheme!, cl.children!, classes);
        strictEqual(vdr.source!.origin, "class");
        strictEqual(vdr.source!.name, classname);
        windows = new HTMLWindowWrapper(document.body!, "");
        const graphics = new SimpleWindowManager(windows);

        const wname = "Test Window";
        const spaceHandle = graphics.openSchemeWindow(wname, "", vdr);
        strictEqual(document.title, wname);

        space = graphics.getSpace(spaceHandle)!;

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
    }).timeout(10000);
});
