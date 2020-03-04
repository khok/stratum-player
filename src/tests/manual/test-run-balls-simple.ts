import { openZipFromUrl, readProjectData } from "~/fileReader/fileReaderHelpers";
import { Project } from "~/core/project";
import { WindowSystem } from "~/graphics/windowSystem";

//Запуск проекта balls_stress_test
(async function() {
    const zipFiles = await openZipFromUrl(["test_projects/balls_stress_test.zip", "/data/library.zip"]);
    const { rootName, collection, varSet } = await readProjectData(zipFiles);
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const windowSystem = new WindowSystem({ globalCanvas: canvas });
    const prj = Project.create({ rootName, classes: collection, windowSystem, varSet });
    let num: number;
    const req = () =>
        (num = window.requestAnimationFrame(() => {
            prj.oneStep();
            windowSystem.renderAll();
            req();
        }));
    req();
    setTimeout(() => window.cancelAnimationFrame(num), 5000);
    // let timeoutOn = false;
    // const req2 = () => {
    //     if (timeoutOn) return;
    //     timeoutOn = true;
    //     setTimeout(() => {
    //         timeoutOn = false;
    //         req2();
    //     }, 16);
    //     prj.oneStep();
    // };
    // req2();
})();
