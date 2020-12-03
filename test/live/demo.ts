import { options, setLogLevel, unzip } from "stratum/api";

// Запуск одной строкой:
// fetch("project.zip").then(r => r.blob()).then(unzip).then(fs => fs.project()).then(p => p.play(windows));
export async function runDemo(name: string, path?: string) {
    options.iconsLocation = "./data/icons";
    setLogLevel("full");
    //prettier-ignore
    //Подгруаем архивчики
    const pr = await Promise.all([`/projects/${name}.zip`, "/data/library.zip"].map(s => fetch(s).then((r) => r.blob()).then(unzip)));
    const fs = pr.reduce((a, b) => a.merge(b));
    // Предзагружаем файлы vdr и bmp.
    // Открываем проект
    await Promise.all([...fs.files(/.+\.(bmp|vdr)$/i)].map((f) => f.makeSync()));
    const project = await fs.project({ additionalClassPaths: ["library"], path });

    if (document.readyState !== "complete") await new Promise((res) => window.addEventListener("load", res));

    // Поехали
    project.play(document.getElementById("main_window_container")!);

    console.log(project);
    {
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

        // Навешиваем калбеки на элементы управления выполнением проекта
        {
            const playerPlayElem = document.getElementById("player_play") as HTMLInputElement;
            const playerPauseElem = document.getElementById("player_pause") as HTMLInputElement;
            const playerStepElem = document.getElementById("player_step") as HTMLInputElement;

            const updateControls = () => {
                playerPlayElem.value = project.state === "closed" ? "Играть" : "Стоп";
                playerPauseElem.value = project.state === "paused" ? "Продолжить" : "Пауза";
                playerPauseElem.disabled = project.state === "closed";
            };

            const handleClick = ({ target }: Event) => {
                switch (target) {
                    case playerPlayElem:
                        project.state === "closed" ? project.play() : project.close();
                        break;
                    case playerPauseElem:
                        project.state === "paused" ? project.continue() : project.pause();
                        break;
                    case playerStepElem:
                        (project.state === "playing" ? project : project.play()).pause().step();
                        break;
                }
                updateControls();
            };
            playerPlayElem.addEventListener("click", handleClick);
            playerPauseElem.addEventListener("click", handleClick);
            playerStepElem.addEventListener("click", handleClick);

            project.on("closed", updateControls);
            updateControls();
            playerPlayElem.disabled = false;
            playerStepElem.disabled = false;
        }
    }
}
