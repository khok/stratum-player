import { strictEqual } from "assert";
import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { VectorDrawingElement } from "stratum/common/fileFormats/vdr/types/vectorDrawingElements";
import { Project } from "stratum/project/project";

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

//тестирует правильность считывания и композиции VDR
(async function () {
    const fs = await VirtualFileSystem.new([{ source: "/test_projects/test_scheme_compose.zip" }, { source: "/data/library.zip" }]);
    const prj = await Project.open(fs, { addSearchDirs: ["library/"] });
    const classes = prj.classes;
    const root = classes.get(prj.rootClassName.toLowerCase())!;
    const scheme = createComposedScheme(root.scheme!, root.children!, classes);
    const elements = toJson(scheme.elements);
    strictEqual(JSON.stringify(elements), JSON.stringify(test_result));
    console.log("Scheme compose test completed.");
})();
