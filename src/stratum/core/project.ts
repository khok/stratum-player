import { ClassData, VarSetData } from "data-types-base";
import { ProjectController, VmBool } from "vm-interfaces-base";
import { GraphicSpace } from "~/graphics/graphicSpace/graphicSpace";
import { SimpleImageLoader } from "~/graphics/graphicSpace/simpleImageLoader";
import { FabricScene } from "~/graphics/renderers/fabricRenderer/fabricScene";
import { WindowSystem, MyResolver } from "~/graphics/windowSystem";
import { createComposedScheme } from "~/helpers/graphics";
import { VmContext } from "~/vm/vmContext";
import { ClassSchemeNode } from "./classSchemeNode";
import { createClassScheme } from "./createClassScheme";
import { MemoryManager } from "./memoryManager";

export interface ProjectOptions {
    iconsPath?: string;
    debug_disableSchemeComposition?: boolean;
}

export class Project implements ProjectController {
    static create(
        {
            rootName,
            classes,
            windowSystem,
            varSet,
            images
        }: {
            rootName: string;
            classes: Map<string, ClassData>;
            windowSystem: WindowSystem;
            varSet?: VarSetData;
            images?: { filename: string; data: string }[];
        },
        options?: ProjectOptions
    ) {
        const { root, mmanager } = createClassScheme(rootName, classes);
        if (varSet) root.applyVarSetRecursive(varSet);
        mmanager.initValues();
        return new Project({ scheme: root, classes, mmanager, windowSystem, images }, options);
    }

    private scheme: ClassSchemeNode;
    private cachedNodes: ClassSchemeNode[];
    private classCollection: Map<string, ClassData>;
    private vm: VmContext;
    private mmanager: MemoryManager;
    private globalImgLoader: SimpleImageLoader;

    constructor(
        data: {
            scheme: ClassSchemeNode;
            classes: Map<string, ClassData>;
            images?: { filename: string; data: string }[];
            windowSystem: WindowSystem;
            mmanager: MemoryManager;
        },
        private options?: ProjectOptions
    ) {
        const iconsPath = (options && options.iconsPath) || "data/icons";
        this.globalImgLoader = new SimpleImageLoader(iconsPath, data.images);
        this.classCollection = data.classes;
        this.scheme = data.scheme;
        this.mmanager = data.mmanager;
        this.vm = new VmContext(data.windowSystem, {} as any, this);
        this.cachedNodes = this.scheme.collectNodes();
    }

    get error() {
        return this.vm.error;
    }

    oneStep() {
        this.scheme.computeSchemeRecursive(this.vm);
        if (this.vm.hasError || this.vm.shouldStop) return false;
        this.mmanager.syncValues();
        return true;
    }

    reset() {
        console.warn("Проект остановлен");
    }

    createSchemeInstance(className: string): MyResolver | undefined {
        const data = this.classCollection.get(className);
        if (!data || !data.scheme) return undefined;
        //TODO: закешировать скомпозированную схему.
        const vdr =
            (!this.options || !this.options.debug_disableSchemeComposition) && data.childs
                ? createComposedScheme(data.scheme, data.childs, this.classCollection)
                : data.scheme;
        return opts => {
            const space = GraphicSpace.fromVdr(
                className,
                vdr,
                this.globalImgLoader,
                new FabricScene({ ...opts, view: vdr.origin })
            );
            this.globalImgLoader.getPromise().then(() => space.scene.forceRender());
            return space;
        };
    }
    hasClass(className: string): VmBool {
        return this.classCollection.get(className) ? 1 : 0;
    }
    *getClassesByProtoName(className: string): IterableIterator<ClassSchemeNode> {
        //TODO: ПЕРЕПИСАТЬ
        for (const node of this.cachedNodes) if (node.protoName === className) yield node;
    }
}
