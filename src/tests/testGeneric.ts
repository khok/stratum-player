import { zipFromUrl, readClassFiles, readProjectFile, readVarsFile, readAllClassFiles } from "../dataLoader";
import { Project } from "../project";
// import { showMissingCommandsInfo } from "../vm/showMissingCommandsInfo";
// import { VmCode, StratumImage } from "../Deserializers";
// import { GraphicElement } from "../Deserializers/graphicElements";
// import WindowSystem from "../WindowSystem";
// import { showMissingCommandsInfo } from "../VM/ShowMissingCommandsInfo";
// import { VmCode } from "../Deserializers";
// import StratumClass from "../StratumClass";

function download(filename: string, text: string) {
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// (async function() {
//     const zipFiles = await zipFromUrl([
//         // "/projects/msgs.zip",
//         "projects/sqr_norm.zip",
//         "/data/library.zip"
//     ]);
//     const mainClassName = "StratumClass_11202814_a13";
//     const collection = await readClassFiles(zipFiles, mainClassName);
//     // const vars = await readVarsFile(zipFiles, collection);
//     console.dir(collection);
//     const prj = Project.fromClassCollection(mainClassName, collection);
//     const bb = prj.tree.getClassesByPath("\\")!;
//     console.log(bb);
//     // prj.compute();
//     console.dir(prj);
//     console.dir(showMissingCommandsInfo(collection));
//     // const s = new WindowSystem({ x: 1920, y: 1080 }, collection, false);
//     // s.setTargetCanvas(document.createElement("canvas"));
//     // s.openScheme("Hello World", "New_Project_Class", "");
// })();

(async function() {
    const zipFiles = await zipFromUrl([
        "projects/sqr_norm.zip",
        // "projects/BALLS.zip",
        "/data/library.zip"
    ]);
    const collection = await readAllClassFiles(zipFiles);
    return;
    const mainClassName = await readProjectFile(zipFiles);
    const vars = await readVarsFile(zipFiles, collection);
    // console.log(vars);
    const prj = Project.fromClassCollection(mainClassName, collection, vars);
    console.dir(prj.createSchemeInstance(mainClassName));
    // console.dir(collection);
    // console.dir(showMissingCommandsInfo(collection));
    // prj.compute();
    // console.dir(prj);
    // const s = new WindowSystem({ x: 1920, y: 1080 }, collection, false);
    // s.setTargetCanvas(document.createElement("canvas"));
    // s.openScheme("Hello World", "New_Project_Class", "");
})();
