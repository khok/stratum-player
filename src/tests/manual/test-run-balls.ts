import { fromUrl } from "~/api";

//Запуск проекта balls_stress_test с использованием api.ts
(async function() {
    const player = await fromUrl(["test_projects/balls_stress_test.zip", "/data/library.zip"]);
    if (!player) return;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;
    player.setGraphicOptions({ globalCanvas: canvas, htmlRoot });
    player.on("WINDOW_CREATED", name => (document.title = name));
    setTimeout(() => player.pause(), 5000);
    try {
        await player.play();
    } catch (e) {
        console.error(e);
        return;
    }
    console.log("Тест завершен");
    for (let i = 0; i < 10; i++) {
        await new Promise(res => setTimeout(res, 400));
        player.oneStep();
        console.log("Шаг ", i + 1);
    }
})();
