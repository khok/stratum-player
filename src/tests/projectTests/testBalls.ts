import { Project } from "../../core/project";
import { readClassFiles, readProjectFile, readVarsFile, zipFromUrl } from "../../fileReader/zipReader";

(async function() {
    const zipFiles = await zipFromUrl([
        // "projects/moving_test.zip",
        "projects/balls_stress_test.zip",
        "/data/library.zip"
    ]);
    //Подгружаем
    const mainClassName = await readProjectFile(zipFiles);
    const classes = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles);
    const prj = new Project(mainClassName, classes, vars);
    let enough = false;
    const req = () =>
        window.requestAnimationFrame(() => {
            if (enough) return;
            prj.compute();
            prj.windows.renderAll();
            req();
        });
    req();
    // setTimeout(() => (enough = true), 5000);
    // while (true) {
    //     await new Promise(res => setTimeout(res, 1));
    // }
})();
