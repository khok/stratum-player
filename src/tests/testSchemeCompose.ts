import { zipFromUrl, readClassFiles, readProjectFile, readVarsFile } from "../dataLoader";
import { Project } from "../project";
import { StratumImage } from "../deserializers";
import { GraphicElement } from "../deserializers/graphicElements";

function getElementGroup(elements: Map<number, GraphicElement>, handle: number) {
    const iterator = elements.values();
    for (let iter = iterator.next(); !iter.done; iter = iterator.next())
        if (iter.value.type == "group" && iter.value.items.includes(handle)) return iter.value;
    return undefined;
}

function collect(elements: Map<number, GraphicElement>, myHandle: number): any {
    const element = elements.get(myHandle)!;
    const name = `${element.type} #${myHandle}${element.name && " "}${element.name}`;
    if (element.type == "group")
        return {
            name,
            data: element.items.map(h => collect(elements, h))
        };
    return name;
}

function toJson(elements: Map<number, GraphicElement>) {
    const iterator = elements.keys();
    const res = [];
    for (let iter = iterator.next(); !iter.done; iter = iterator.next()) {
        if (getElementGroup(elements, iter.value) == undefined) res.push(collect(elements, iter.value));
    }
    return res;
}

const test_result = [
    { name: "group #2", data: ["bitmap #1"] },
    { name: "group #5", data: ["bitmap #3", "bitmap #4"] },
    "line #7 bkg",
    {
        name: "group #8",
        data: [
            "bitmap #6",
            {
                name: "group #18",
                data: [
                    { name: "group #15", data: ["line #11", "line #13"] },
                    "line #16",
                    {
                        name: "group #17",
                        data: [{ name: "group #12 Nahui", data: ["line #10", "line #9"] }, "line #14"]
                    }
                ]
            }
        ]
    },
    "line #34",
    "line #35"
];

(async function() {
    const zipFiles = await zipFromUrl([
        "/projects/test_scheme_compose.zip",
        // "projects/BALLS.zip",
        "/data/library.zip"
    ]);
    const mainClassName = await readProjectFile(zipFiles);
    const collection = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles, collection);
    const prj = Project.fromClassCollection(mainClassName, collection, vars);
    prj.createSchemeInstance(mainClassName);
    if (
        JSON.stringify(toJson((<StratumImage>prj.collection.get(mainClassName)!.scheme).elements)) ==
        JSON.stringify(test_result)
    )
        console.log("Scheme compose test completed");
    else throw new Error("Assertion error");
})();
