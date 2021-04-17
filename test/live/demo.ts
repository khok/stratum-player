// Запуск одной строкой:

import { options } from "stratum/options";
import { RealPlayer } from "stratum/player";
import { RealZipFS } from "zipfs/realZipfs";

// fetch("project.zip").then(r => r.blob()).then(unzip).then(fs => fs.project()).then(p => p.play(windows));
export async function runDemo(name: string, strat: "smooth" | "fast" = "smooth", path?: string) {
    options.iconsLocation = "./data/icons";
    // setLogLevel("full");
    //prettier-ignore
    //Подгруаем архивчики
    const pr = await Promise.all([`/projects/${name}.zip`, "/data/library.zip"].map(s => fetch(s).then((r) => r.blob()).then(RealZipFS.create)));
    const first = pr[0].files(/.+\.(prj|spj)$/i).next().value;
    if (!first) throw Error();
    const fs = pr.reduce((a, b) => a.merge(b));
    console.log(fs);

    // Предзагружаем файлы vdr и bmp.
    // Открываем проект
    // await Promise.all([...fs.files(/.+\.(bmp|vdr|txt|mat)$/i)].map((f) => f.makeSync()));
    const project = await RealPlayer.create(first, [{ type: "library", loadClasses: true, dir: fs.path("C:/library") }]);

    // const cl = (project as RealPlayer)["lib"]!.get("LGSpace")!;
    //     let code = `
    //     float hspace
    // x := 0
    // y := 0
    // switch
    //   case(~hspace == 1)
    //     x := 1
    //  case(~hspace == 3)
    //     x := 3
    //    default
    //      y := 4
    //     default
    //      y := x
    //    case(~hspace == 2)
    //      x := 4
    //               default
    //     x := 3

    // endswitch
    //     `;
    //     code = `
    //     float x
    //     SendMessage();
    // do
    //   x :=  -(1 + 3) ^ 4
    // until(~x < 10)
    // ret := ~x < 10
    //     `;
    // translate(code, cl.vars, "lgspace", (project as RealPlayer)["projectRes"].classes);
    // if (document.readyState !== "complete") await new Promise((res) => window.addEventListener("load", res));
    // return;
    // Поехали
    project.speed(strat).play(document.getElementById("main_window_container")!);
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
