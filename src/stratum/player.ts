import { ClassData, VarSetData } from "cls-types";
import { ClassSchemeNode } from "~/core/classSchemeNode";
import { createClassTree } from "~/core/createClassScheme";
import { MemoryManager } from "~/core/memoryManager";
import { Project, ProjectOptions } from "~/core/project";
import { BitmapToolFactory, BitmapToolFactoryOptions } from "~/graphics/graphicSpace/bitmapToolFactory";
import { GraphicSystem, GraphicSystemOptions } from "~/graphics/graphicSystem";
import { VmContext } from "~/vm/vmContext";
import { EventDispatcher, EventType } from "./helpers/eventDispatcher";

export interface PlayerData {
    rootName: string;
    classesData: Map<string, ClassData>;
    varSet?: VarSetData;
    images?: { filename: string; data: Uint8Array }[];
}

export interface PlayerOptions extends ProjectOptions, GraphicSystemOptions, BitmapToolFactoryOptions {
    iconsPath?: string;
}

export class Player {
    private vm: VmContext;
    private classTree: ClassSchemeNode;
    private mmanager: MemoryManager;
    private graphics: GraphicSystem;
    private dispatcher: EventDispatcher;

    constructor(data: PlayerData, options?: PlayerOptions) {
        const { classesData } = data;
        const { classTree, mmanager } = createClassTree(data.rootName, classesData);
        const allClasses = classTree.collectNodes();
        if (data.varSet) classTree.applyVarSetRecursive(data.varSet);

        if (!options) options = {};
        const iconsPath = options.iconsPath || "data/icons";
        const bmpFactory = new BitmapToolFactory({ iconsPath, projectImages: data.images }, options);
        const dispatcher = (options.dispatcher = options.dispatcher || new EventDispatcher());
        const graphics = new GraphicSystem(bmpFactory, options);
        const project = new Project({ allClasses, classesData }, options);

        this.vm = new VmContext({ graphics, project, memoryState: mmanager });
        this.classTree = classTree;
        this.mmanager = mmanager;
        this.graphics = graphics;
        this.dispatcher = dispatcher;

        mmanager.initValues();
    }

    setGraphicOptions(options: GraphicSystemOptions) {
        this.graphics.set(options);
        return this;
    }

    get error() {
        return this.vm.error;
    }

    init() {
        throw new Error("Не реализовано");
    }

    step() {
        this.classTree.computeSchemeRecursive(this.vm);
        if (this.vm.hasError || this.vm.shouldStop) return false;
        this.mmanager.syncValues();
        this.mmanager.assertZeroIndexEmpty();
        return true;
    }

    render() {
        return this.graphics.renderAll();
    }

    on(event: EventType, fn: (...data: any) => void) {
        this.dispatcher.on(event, fn);
    }
}
