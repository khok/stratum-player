import { unzip, ws } from "stratum/api";

// Запуск одной строкой:
// fetch("project.zip").then(r => r.blob()).then(unzip).then(fs => fs.project()).then(p => p.play(windows));
export async function runDemo(name: string, tailPath?: string) {
    //prettier-ignore
    //Подгруаем архивчики
    const pr = await Promise.all([`/projects/${name}.zip`, "/data/library.zip"].map(s => fetch(s).then((r) => r.blob()).then(unzip)));
    const fs = pr.reduce((a, b) => a.merge(b));
    // Предзагружаем файлы vdr и bmp.
    // Открываем проект
    await Promise.all([...fs.search(/.+\.(bmp)|(vdr)$/i)].map((f) => f.makeSync()));
    const project = await fs.project({ additionalClassPaths: ["library"], tailPath });

    // Создаем оконный хост.
    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;
    const windows = ws({ globalCanvas, htmlRoot, disableSceneResize: false });

    // Поехали
    project
        .on("error", console.warn)
        .on("closed", () => console.log("Проект остановлен"))
        .play(windows);

    const rdrCb = () => (windows.redraw(), requestAnimationFrame(rdrCb));
    requestAnimationFrame(rdrCb);

    console.log(project);

    {
        const pauseElem = document.getElementById("pause") as HTMLButtonElement;
        const againElem = document.getElementById("again") as HTMLButtonElement;
        const stepElem = document.getElementById("step") as HTMLButtonElement;
        const stopElem = document.getElementById("stop") as HTMLButtonElement;
        const rateElem = document.getElementById("rate") as HTMLInputElement;
        const diagElem = document.getElementById("diag") as HTMLParagraphElement;

        let lastp = project.diag.iterations;
        let lastTime = new Date().getTime();
        const lp = () => {
            setTimeout(lp, Math.max(parseInt(rateElem.value), 16));
            const newp = project.diag.iterations;
            const newTime = new Date().getTime();
            const diff = newp - lastp;
            const timeDiff = newTime - lastTime;
            lastp = newp;
            lastTime = newTime;
            diagElem.innerHTML = "циклов ВМ: " + newp.toString() + ". Циклов в сек:" + Math.round(diff / (timeDiff * 0.001));
        };
        lp();

        const upd = () => (pauseElem.innerHTML = project.state === "paused" ? "Продолжить" : "Пауза");
        pauseElem.onclick = () => (project.state === "paused" ? project.continue() : project.pause(), upd());
        againElem.onclick = () => (project.close().play(), upd());
        stepElem.onclick = () => (project.play().pause().step(), upd());
        stopElem.onclick = () => (project.close(), upd());
    }
}
