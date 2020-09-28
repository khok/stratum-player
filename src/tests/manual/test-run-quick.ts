import { buildTree } from "/classTree/buildTree";
import { TreeManager } from "/classTree/treeManager";
import { createComposedScheme } from "/common/createComposedScheme";
import { EventDispatcher } from "/common/eventDispatcher";
import { VirtualFileSystem } from "/common/virtualFileSystem";
import { GraphicsManager } from "/graphics/manager/graphicsManager";
import { SimpleWindow } from "/graphics/manager/simpleWindow";
import { BmpToolFactory, Scene } from "/graphics/scene";
import { SingleCanvasWindowSystem } from "/graphics/windowSystems";
import { Project } from "/project/project";
import { ExecutionContext } from "/vm/executionContext";
import { parseBytecode } from "/vm/parseBytecode";
import { findMissingCommands2, formatMissingCommands } from "/vm/showMissingCommands";

export async function _run_test_quick(name: string, options: any, timeout?: number) {
    const fs = await VirtualFileSystem.new([
        { source: `/test_projects/${name}.zip`, prefix: "C:/Projects" },
        { source: "/data/library.zip", prefix: "C:/Library" },
    ]);
    const prj = await Project.open(fs, { addSearchDirs: ["C:/Library"], bytecodeParser: parseBytecode });
    await Promise.all(fs.findFiles(".bmp", prj.baseDirectory).map((f) => f.makeSync()));

    const classes = prj.classes;

    const miss = findMissingCommands2(prj.rootClassName, classes);
    if (miss.errors.length > 0) console.warn("Ошибки:", miss.errors);
    if (miss.missingOperations.length > 0) console.warn(formatMissingCommands(miss.missingOperations));

    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;

    const ws = new SingleCanvasWindowSystem({ globalCanvas, htmlRoot });
    const windows = new GraphicsManager(ws, { disableSceneResize: false });

    const tree = buildTree(prj.rootClassName, classes);
    const memoryManager = tree.createMemoryManager();

    if (prj.preloadStt) tree.applyVarSet(prj.preloadStt);
    else console.warn(`Файл ${prj.baseDirectory + "\\_preload.stt"} не существует.`);
    const classManager = new TreeManager({ tree });

    const ctx = new ExecutionContext({ classManager, memoryManager, windows, projectManager: prj });

    const dispatcher = new EventDispatcher();
    dispatcher.on("VM_ERROR", (err) => console.error(err));
    dispatcher.on("PROJECT_STOPPED", () => {
        console.log("Проект остановен");
        windows.closeAllWindows();
        setTimeout(() => {
            memoryManager.initValues();
            ctx.executionStopped = false;
            window.requestAnimationFrame(req);
        }, 3000);
    });

    // const computer = new TreeComputer({ tree, mmanager: memoryManager, dispatcher });

    // const date = new Date().getTime();
    // let elapsed = 0;
    const req = () => {
        // console.log(++elapsed / ((new Date().getTime() - date) / 1000));
        tree.compute(ctx);
        ws.redrawWindows();
        if (ctx.executionStopped) {
            if (ctx.error) dispatcher.dispatch("VM_ERROR", ctx.error);
            else dispatcher.dispatch("PROJECT_STOPPED");
            return;
        }
        memoryManager.syncValues();
        memoryManager.assertZeroIndexEmpty();
        requestAnimationFrame(req);
    };
    memoryManager.initValues();
    requestAnimationFrame(req);

    // // const player = await fromUrl([`test_projects/${name}.zip`, "/data/library.zip"], opts);
    // player
    //     .setGraphicOptions({ globalCanvas, htmlRoot })
    //     .on("WINDOW_CREATED", (name) => (document.title = name))
    //     .on("VM_ERROR", (err) => console.error(err))
    //     .on("PROJECT_STOPPED", () => console.log("Проект остановен"))
    //     .play();
    // if (timeout)
    //     setTimeout(() => {
    //         console.log("Тест завершен");
    //         player.stopPlay();
    //     }, timeout);

    // const player = new Player();
    // const prjHandle = await player.loadProject(fs);
}

//Запуск проекта `name` с использованием api.ts
export async function _show_scheme(name: string, className?: string) {
    const fs = await VirtualFileSystem.new([{ source: `/test_projects/${name}.zip` }, { source: "/data/library.zip" }]);
    const prj = await Project.open(fs, { addSearchDirs: ["library/"] });
    const classes = prj.classes;
    console.dir(classes);

    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;

    const target = className || prj.rootClassName;
    const root = classes.get(target.toLowerCase());

    if (!root || !root.scheme) {
        alert(`There is no scheme for ${target}`);
        return;
    }
    const scheme = root.children ? createComposedScheme(root.scheme, root.children, classes) : root.scheme;

    console.dir(scheme);
    const wnd = new SingleCanvasWindowSystem({ globalCanvas, htmlRoot }).createWindow("");
    const window = new SimpleWindow({ window: wnd });
    new Scene({ handle: 0, vdr: scheme, window });
    BmpToolFactory.allImagesLoaded.then(() => wnd.redraw());
}
