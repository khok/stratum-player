import { buildTree } from "stratum/classTree/buildTree";
import { NodeCode } from "stratum/classTree/nodeCode";
import { TreeManager } from "stratum/classTree/treeManager";
import { TreeMemoryManager } from "stratum/classTree/treeMemoryManager";
import { TreeNode } from "stratum/classTree/treeNode";
import { EventDispatcher, EventType } from "stratum/common/eventDispatcher";
import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { GraphicsManager, GraphicsManagerOptions } from "stratum/graphics/manager/graphicsManager";
import { WindowSystem } from "stratum/graphics/manager/interfaces";
import { HandleMap } from "stratum/helpers/handleMap";
import { Project } from "stratum/project/project";
import { ExecutionContext } from "stratum/vm/executionContext";

export interface PlayerArgs extends GraphicsManagerOptions {
    fs: VirtualFileSystem;
    windowSystem: WindowSystem;
}

interface LoadedProject {
    tree: TreeNode;
    ctx: ExecutionContext;
    mmanager: TreeMemoryManager;
}

export class Player {
    private readonly dispatcher = new EventDispatcher();
    private readonly ws: WindowSystem;
    private readonly graphics: GraphicsManager;

    private projects = HandleMap.create<LoadedProject>();
    private currentProject?: LoadedProject;

    private reqId = 0;

    constructor(args: PlayerArgs) {
        this.ws = args.windowSystem;
        this.graphics = new GraphicsManager(this.ws, args);
    }

    on<T extends keyof EventType>(event: T, fn: EventType[T]) {
        this.dispatcher.on(event, fn);
        return this;
    }

    setGraphicOptions(options: GraphicsManagerOptions) {
        this.graphics.set(options);
        return this;
    }

    loadProject(prj: Project<NodeCode>) {
        const tree = buildTree(prj.rootClassName, prj.classes);
        const memoryManager = tree.createMemoryManager();

        if (prj.preloadStt) tree.applyVarSet(prj.preloadStt);
        else console.warn(`Файл ${prj.baseDirectory + "\\_preload.stt"} не существует.`);

        const ctx = new ExecutionContext({
            classManager: new TreeManager({ tree }),
            memoryManager,
            windows: this.graphics,
            projectManager: prj,
        });

        const handle = HandleMap.getFreeHandle(this.projects);
        this.projects.set(handle, { tree, ctx, mmanager: memoryManager });
        return handle;
    }

    removeProject(handle: number) {
        this.projects.delete(handle);
    }

    removeAllProjects() {
        this.projects = new Map();
    }

    switchProject(handle: number) {
        this.currentProject = this.projects.get(handle);
    }

    get isPaused() {
        return this.reqId === 0;
    }

    pause() {
        if (!this.isPaused) cancelAnimationFrame(this.reqId);
        this.reqId = 0;
    }

    continue() {
        if (this.isPaused) this.play();
    }

    switchPause() {
        if (this.reqId) this.pause();
        else this.continue();
    }

    stop() {
        this.pause();
        this.currentProject = undefined;
        this.graphics.closeAllWindows();
    }

    init() {
        if (!this.currentProject) return;
        this.pause();
        this.graphics.closeAllWindows();
        const { mmanager, ctx } = this.currentProject;
        mmanager.initValues();
        ctx.hasError = false;
        ctx.executionStopped = false;
    }

    step() {
        if (!this.currentProject) return false;
        const { ctx, mmanager, tree } = this.currentProject;
        tree.compute(ctx);
        this.ws.redrawWindows();
        if (ctx.executionStopped) {
            if (ctx.hasError) this.dispatcher.dispatch("VM_ERROR", ctx.error);
            else this.dispatcher.dispatch("PROJECT_STOPPED");
            return false;
        }
        mmanager.syncValues();
        mmanager.assertZeroIndexEmpty();
        return true;
    }

    play(func: (callback: () => void) => number = requestAnimationFrame) {
        if (!this.currentProject || this.currentProject.ctx.executionStopped) return;
        const req = () => {
            if (this.step()) this.reqId = func(req);
        };
        this.reqId = func(req);
    }
}
