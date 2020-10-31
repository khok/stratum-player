import { unzip } from "stratum/api";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { VectorDrawingElement } from "stratum/fileFormats/vdr";
import { Player } from "stratum/player";
const { strictEqual } = chai.assert;

function isElementInGroup(elements: VectorDrawingElement[], handle: number) {
    return elements.some((el) => el.type === "otGROUP2D" && el.childHandles.includes(handle));
}

function collect(elements: VectorDrawingElement[], element: VectorDrawingElement): unknown {
    const { handle } = element;
    const name = `${element.type} #${handle}${element.name && " "}${element.name}`;
    if (element.type === "otGROUP2D")
        return {
            name,
            data: element.childHandles.map((h) => collect(elements, elements.find((el) => el.handle === h)!)),
        };
    return name;
}

function toJson(elements: VectorDrawingElement[]) {
    const topLevelElements = elements.filter((el) => !isElementInGroup(elements, el.handle));
    return topLevelElements.map((el) => collect(elements, el));
}

const test_result = [
    { name: "otGROUP2D #2", data: ["otDOUBLEBITMAP2D #1"] },
    { name: "otGROUP2D #5", data: ["otDOUBLEBITMAP2D #3", "otBITMAP2D #4"] },
    "otLINE2D #7 bkg",
    {
        name: "otGROUP2D #8",
        data: [
            "otDOUBLEBITMAP2D #6",
            {
                name: "otGROUP2D #18",
                data: [
                    { name: "otGROUP2D #15", data: ["otLINE2D #11", "otLINE2D #13"] },
                    "otLINE2D #16",
                    {
                        name: "otGROUP2D #17",
                        data: [{ name: "otGROUP2D #12 Nahui", data: ["otLINE2D #10", "otLINE2D #9"] }, "otLINE2D #14"],
                    },
                ],
            },
        ],
    },
    "otLINE2D #34",
    "otLINE2D #35",
];

it("Тестирует правильность считывания и композиции VDR", async () => {
    const [a1, a2] = await Promise.all(
        ["/projects/test_scheme_compose.zip", "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(unzip)
        )
    );
    const prj = (await a1.merge(a2).project({ additionalClassPaths: ["library"] })) as Player;

    const classes = prj.classes;
    const root = classes.get(prj.rootClassName.toUpperCase())!;
    const scheme = createComposedScheme(root.scheme!, root.children!, classes);
    const elements = toJson(scheme.elements);
    strictEqual(JSON.stringify(elements), JSON.stringify(test_result));
});
