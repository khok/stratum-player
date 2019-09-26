import { equal } from "assert";
import { Project } from "../core/projectInstance";
import { readClassFiles, readProjectFile, readVarsFile, zipFromUrl } from "../fileReader/zipReader";
import { Element, HandleMap } from "../graphics/types";

function getElementGroup(elements: HandleMap<Element>, handle: number) {
    const iterator = elements.values();
    for (let iter = iterator.next(); !iter.done; iter = iterator.next())
        if (iter.value.type == "group" && iter.value.childHandles.includes(handle)) return iter.value;
    return undefined;
}

function collect(elements: HandleMap<Element>, myHandle: number): any {
    const element = elements.get(myHandle)!;
    const name = `${element.type} #${myHandle}${element.name && " "}${element.name}`;
    if (element.type == "group")
        return {
            name,
            data: element.childHandles.map(h => collect(elements, h))
        };
    return name;
}

function toJson(elements: HandleMap<Element>) {
    const iterator = elements.keys();
    const res = [];
    for (let iter = iterator.next(); !iter.done; iter = iterator.next()) {
        if (getElementGroup(elements, iter.value) == undefined) res.push(collect(elements, iter.value));
    }
    return res;
}

const test_result = [
    { name: "group #2", data: ["doubleBitmap #1"] },
    { name: "group #5", data: ["doubleBitmap #3", "bitmap #4"] },
    "line #7 bkg",
    {
        name: "group #8",
        data: [
            "doubleBitmap #6",
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
    const zipFiles = await zipFromUrl(["/projects/test_scheme_compose.zip", "/data/library.zip"]);
    const mainClassName = await readProjectFile(zipFiles);
    const collection = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles);
    const prj = new Project(mainClassName, collection, vars);
    prj.createSchemeInstance(mainClassName);
    const scheme = collection.get(mainClassName)!.scheme!;
    const elements = toJson(scheme.elements!);
    equal(JSON.stringify(elements), JSON.stringify(test_result));
    console.log("Scheme compose test completed");
})();
