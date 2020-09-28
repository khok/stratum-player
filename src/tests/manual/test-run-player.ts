import { VirtualFileSystem, SingleCanvasWindowSystem, Player, openProject } from "stratum/api";

export async function _run_test_player(name: string, prjFileName?: string) {
    const fs = await VirtualFileSystem.new([{ source: `/test_projects/${name}.zip` }, { source: "/data/library.zip" }]);
    const prj = await openProject(fs, { addSearchDirs: ["/library"], prjFileName });
    await Promise.all(fs.findFiles(".bmp").map((f) => f.makeSync()));
    await Promise.all(fs.findFiles(".vdr").map((f) => f.makeSync()));

    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;

    const windowSystem = new SingleCanvasWindowSystem({ globalCanvas, htmlRoot });
    const player = new Player({ fs, windowSystem })
        .on("VM_ERROR", (err) => console.error(err))
        .on("PROJECT_STOPPED", () => console.log("Проект остановлен"));

    const handle = player.loadProject(prj);
    player.switchProject(handle);
    player.init();
    player.play();

    (document.getElementById("stop")! as HTMLButtonElement).onclick = () => {
        (document.getElementById("pause")! as HTMLButtonElement).innerHTML = "Продолжить";
        player.stop();
    };
    (document.getElementById("pause")! as HTMLButtonElement).onclick = () => {
        player.switchPause();
        (document.getElementById("pause")! as HTMLButtonElement).innerHTML = player.isPaused ? "Продолжить" : "Пауза";
    };
    (document.getElementById("again")! as HTMLButtonElement).onclick = () => {
        player.switchProject(handle);
        player.init();
        player.play();
        (document.getElementById("pause")! as HTMLButtonElement).innerHTML = "Пауза";
    };
}
