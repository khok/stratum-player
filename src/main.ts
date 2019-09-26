import { readClassFiles, readProjectFile, readVarsFile, zipFromFileList, zipFromUrl } from "./fileReader/zipReader";
import { showMissingCommands } from "./utils/showMissingCommands";
import { Project } from "./core/projectInstance";

var libFiles: any;
(async function() {
    libFiles = await zipFromUrl("/data/library.zip");
})();

async function loadProject(fList: FileList) {
    const zipFiles = (await zipFromFileList(fList)).concat(libFiles);
    const mainClassName = await readProjectFile(zipFiles);
    const allClasses = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles);
    const { messages, missingOperations } = showMissingCommands(allClasses);
    if (messages.length > 0 || missingOperations.length > 0) {
        if (messages.length > 0) console.log(messages.concat(";\n"));
        if (missingOperations.length > 0) {
            console.log(`Не реализованы операции (всего ${missingOperations.length})`);
            console.log(missingOperations.map(({ name, classNames }) => `${name} в ${classNames}`).join(";\n"));
        }
        alert("Возникли ошибки (см в консоли (F12))");
        return;
    }
    const prj = new Project(mainClassName, allClasses, vars);
    let enough = false;
    const req = () =>
        window.requestAnimationFrame(() => {
            if (enough) return;
            prj.compute();
            prj.windows.renderAll();
            req();
        });
    req();
}

window.onload = () => {
    const input = document.getElementById("input")!;
    input.addEventListener("change", evt => {
        const fList = (evt.target as HTMLInputElement).files;
        if (!fList) return;
        loadProject(fList);
        const cnv = document.createElement("canvas");
        cnv.setAttribute("id", "canvas");
        cnv.setAttribute("style", "border:1px solid #000000;");
        input.replaceWith(cnv);
        // input.remove();
    });
};
