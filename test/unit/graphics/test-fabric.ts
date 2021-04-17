// import { unzip } from "stratum/api";
// import { ClassLibrary } from "stratum/common/classLibrary";
// import { ClassProto } from "stratum/common/classProto";
// import { Scene } from "stratum/graphics/scene";
// import { GraphicsManager } from "stratum/graphics";
// import { BinaryStream } from "stratum/helpers/binaryStream";
// import { SimpleWs } from "stratum/player/ws";
// const { strictEqual } = chai.assert;

// describe("Сцена fabric рисуется корректно", () => {
//     let space: Scene;
//     it("Шаг 1", async () => {
//         const [a1, a2] = await Promise.all(
//             ["/projects/test_balls.zip", "/data/library.zip"].map((s) =>
//                 fetch(s)
//                     .then((r) => r.blob())
//                     .then(unzip)
//             )
//         );

//         const classFiles = [...a1.merge(a2).files(/.+\.cls$/i)];
//         const cl = await Promise.all(classFiles.map((f) => f.arraybuffer()));
//         const lib = new ClassLibrary(cl.map((s) => new ClassProto(new BinaryStream(s))));

//         const classname = "WorkSpace";
//         const vdr = lib.getComposedScheme(classname)!;
//         strictEqual(vdr.source!.origin, "class");
//         strictEqual(vdr.source!.name, classname);

//         const graphics = new GraphicsManager(new SimpleWs(document.body));

//         const wname = "Test Window";
//         const spaceHandle = graphics.openWindow(wname, "", vdr);

//         space = graphics["scenes"].get(spaceHandle)!;

//         const elements = vdr.elements!;
//         for (const elem of elements) {
//             const obj = space.getObject(elem.handle)!;
//             strictEqual(obj.type, elem.type);
//             strictEqual(obj.handle, elem.handle);
//             strictEqual(obj.name, elem.name);
//             if (elem.type === "otGROUP2D" && obj.type === "otGROUP2D") {
//                 strictEqual(obj.items.length, elem.childHandles.length);
//                 for (const child of elem.childHandles) {
//                     strictEqual(space.getObject(child)!.parent, obj);
//                 }
//             }
//         }
//     }).timeout(10000);
//     it("Шаг 2", async () => {
//         await new Promise((res) => setTimeout(res, 300));
//         space.setOrigin(30, 30);
//         strictEqual(space.getObjectFromPoint2d(40, 40), 0);
//         space.getObject(33)!.setPosition(32, 32);
//         strictEqual(space.getObjectFromPoint2d(40, 40), 34);
//     }).timeout(10000);
// });
