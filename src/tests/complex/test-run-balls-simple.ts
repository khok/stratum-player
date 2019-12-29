import { openZipFromUrl, loadProjectData } from "~/fileReader/fileReaderHelpers";
import { Project } from "~/core/project";
import { WindowSystem } from "~/graphics/windowSystem";

(async function() {
    const zipFiles = await openZipFromUrl(["test_projects/balls_stress_test.zip", "/data/library.zip"]);
    const { rootName, collection, varSet } = await loadProjectData(zipFiles);
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ws = new WindowSystem({ globalCanvas: canvas });
    const prj = Project.create(rootName, collection, ws, varSet);
    let num: number;
    // let start = 0;
    const req = () =>
        (num = window.requestAnimationFrame(() => {
            prj.oneStep();
            ws.renderAll();
            req();
        }));
    req();
    setTimeout(() => window.cancelAnimationFrame(num), 5000);
    return;
    let timeoutOn = false;
    const req2 = () => {
        if (timeoutOn) return;
        timeoutOn = true;
        setTimeout(() => {
            timeoutOn = false;
            req2();
        }, 16);
        prj.oneStep();
    };
    req2();
})();
