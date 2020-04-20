import { ClassData, VarSetData } from "data-types-base";
import { ClassSchemeNode } from "~/core/classSchemeNode";
import { createClassTree } from "~/core/createClassScheme";
import { MemoryManager } from "~/core/memoryManager";
import { Project, ProjectOptions } from "~/core/project";
import { BitmapToolFactory } from "~/graphics/graphicSpace/bitmapToolFactory";
import { WindowSystem, WindowSystemOptions } from "~/graphics/windowSystem";
import { VmContext } from "~/vm/vmContext";

export interface PlayerData {
    rootName: string;
    classesData: Map<string, ClassData>;
    varSet?: VarSetData;
    images?: { filename: string; data: Uint8Array }[];
}

export interface PlayerOptions extends ProjectOptions, WindowSystemOptions {
    iconsPath?: string;
}

export class Player {
    private vm: VmContext;
    private classTree: ClassSchemeNode;
    private mmanager: MemoryManager;
    private windows: WindowSystem;

    constructor(data: PlayerData, options?: PlayerOptions) {
        if (!options) options = {};
        const { classesData } = data;
        const { classTree, mmanager } = createClassTree(data.rootName, classesData);
        const allClasses = classTree.collectNodes();
        if (data.varSet) classTree.applyVarSetRecursive(data.varSet);

        const imgLoader = new BitmapToolFactory((options && options.iconsPath) || "data/icons", data.images);
        const windows = new WindowSystem(imgLoader, options);
        const project = new Project({ allClasses, classesData }, options);

        this.vm = new VmContext({ windows, project, memoryState: mmanager });
        this.classTree = classTree;
        this.mmanager = mmanager;
        this.windows = windows;

        mmanager.initValues();
    }

    set(options: WindowSystemOptions) {
        this.windows.set(options);
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
        return this.windows.renderAll();
    }
}
