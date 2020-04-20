import { equal } from "assert";
import { ElementData } from "data-types-graphics";
import { openZipFromUrl, readProjectData } from "~/fileReader/fileReaderHelpers";
import { createComposedScheme } from "~/helpers/graphics";

function isElementInGroup(elements: ElementData[], handle: number) {
    return elements.some((el) => el.type === "otGROUP2D" && el.childHandles.includes(handle));
}

function collect(elements: ElementData[], element: ElementData): unknown {
    const { handle } = element;
    const name = `${element.type} #${handle}${element.name && " "}${element.name}`;
    if (element.type === "otGROUP2D")
        return {
            name,
            data: element.childHandles.map((h) => collect(elements, elements.find((el) => el.handle === h)!)),
        };
    return name;
}

function toJson(elements: ElementData[]) {
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
    const zipFiles = await openZipFromUrl(["/test_projects/test_scheme_compose.zip", "/data/library.zip"]);
    const { classesData, rootName } = await readProjectData(zipFiles);
    const root = classesData.get(rootName)!;
    const scheme = createComposedScheme(root.scheme!, root.childInfo!, classesData);
    const elements = toJson(scheme.elements);
    equal(JSON.stringify(elements), JSON.stringify(test_result));
    console.log("Scheme compose test completed");
})();
