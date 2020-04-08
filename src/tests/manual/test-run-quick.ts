import { fromUrl, PlayerOptions } from "~/api";

//Запуск проекта `name` с использованием api.ts
export async function _run_test_quick(name: string, opts: PlayerOptions, timeout: number) {
    const player = await fromUrl([`test_projects/${name}.zip`, "/data/library.zip"], opts);
    console.dir(player);
    if (!player) return;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;
    player.setGraphicOptions({ globalCanvas: canvas, htmlRoot });
    player.on("WINDOW_CREATED", (name) => (document.title = name));
    setTimeout(() => player.pause(), timeout);
    try {
        await player.play();
    } catch (e) {
        console.error(e);
        return;
    }
    console.log("Тест завершен");
    for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 400));
        player.oneStep();
        console.log("Шаг ", i + 1);
    }
}
