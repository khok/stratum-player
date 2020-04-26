import { fromUrl, ExtendedPlayerOptions } from "~/api";
import { showMissingCommands, formatMissingCommands } from "~/helpers/showMissingCommands";
import { VmOperations } from "~/vm/operations";
import { Project } from "~/core/project";

//Запуск проекта `name` с использованием api.ts
export async function _run_test_quick(name: string, opts: ExtendedPlayerOptions, timeout?: number) {
    const player = await fromUrl([`test_projects/${name}.zip`, "/data/library.zip"], opts);
    console.dir(player);
    const mc = showMissingCommands((player!["vm"]["project"] as Project)["classesData"], VmOperations);
    console.log(formatMissingCommands(mc.missingOperations));
    if (!player) return;
    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;
    player
        .setGraphicOptions({ globalCanvas, htmlRoot })
        .on("WINDOW_CREATED", (name) => (document.title = name))
        .on("VM_ERROR", (err) => console.error(err))
        .on("PROJECT_STOPPED", () => console.log("Проект остановен"))
        .play();
    if (timeout)
        setTimeout(() => {
            console.log("Тест завершен");
            player.stopPlay();
        }, timeout);
}
