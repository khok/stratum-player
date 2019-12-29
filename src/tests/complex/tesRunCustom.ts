import { loadProjectData, openZipFromFileList, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { formatMissingCommands, showMissingCommands } from "~/helpers/showMissingCommands";
import { VmOperations } from "~/vm/operations";
import { JSZipObject } from "jszip";

let libFiles: JSZipObject[];
let resolveLib: (() => void) | undefined = undefined;
(async function() {
    libFiles = await openZipFromUrl("/data/library.zip");
    if (resolveLib !== undefined) resolveLib!();
})();

export async function loadZippedProject(fList: FileList) {
    const zipFiles = await openZipFromFileList(fList);
    await runProject(zipFiles);
}

export async function runProject(zipFiles: JSZipObject[]) {
    if (!libFiles) await new Promise(res => (resolveLib = res));
    const { collection: allClasses } = await loadProjectData(zipFiles.concat(libFiles));
    const { errors, missingOperations } = showMissingCommands(allClasses, VmOperations);
    if (errors.length > 0 || missingOperations.length > 0) {
        if (errors.length > 0) console.log(errors.concat(";\n"));
        if (missingOperations.length > 0) {
            console.log(formatMissingCommands(missingOperations));
        }
        alert("Возникли ошибки (см в консоли (F12))");
        return;
    }
    console.log("Проект загружен");
    // const prj = new Project(rootName, allClasses, vars);
    // let enough = false;
    // const req = () =>
    //     window.requestAnimationFrame(() => {
    //         if (enough) return;
    //         prj.compute();
    //         prj.windows.renderAll();
    //         req();
    //     });
    // req();
}

window.onload = () => {
    const input = document.getElementById("input")!;
    input.addEventListener("change", evt => {
        const fList = (evt.target as HTMLInputElement).files;
        if (!fList) return;
        loadZippedProject(fList);
        const cnv = document.createElement("canvas");
        cnv.setAttribute("id", "canvas");
        cnv.setAttribute("style", "border:1px solid #000000;");
        input.replaceWith(cnv);
        // input.remove();
    });
};
