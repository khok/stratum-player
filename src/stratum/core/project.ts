import { ClassData } from "cls-types";
import { ProjectController, VmBool } from "vm-interfaces-core";
import { GraphicSpace } from "~/graphics/graphicSpace/graphicSpace";
import { MyResolver } from "~/graphics/graphicSystem";
import { createComposedScheme } from "~/helpers/graphics";
import { ClassSchemeNode } from "./classSchemeNode";

export interface ProjectData {
    allClasses: ClassSchemeNode[];
    classesData: Map<string, ClassData>;
}

export interface ProjectOptions {
    debug_disableSchemeCompose?: boolean;
}

export class Project implements ProjectController {
    private classNodes: ClassSchemeNode[];
    private classesData: Map<string, ClassData>;

    constructor(data: ProjectData, private options?: ProjectOptions) {
        this.classNodes = data.allClasses;
        this.classesData = data.classesData;
    }

    createSchemeInstance(className: string): MyResolver | undefined {
        const data = this.classesData.get(className);
        if (!data || !data.scheme) return undefined;
        //TODO: закешировать скомпозированную схему.
        const vdr =
            (!this.options || !this.options.debug_disableSchemeCompose) && data.childInfo
                ? createComposedScheme(data.scheme, data.childInfo, this.classesData)
                : data.scheme;
        return ({ bmpFactory, scene }) => GraphicSpace.fromVdr(className, vdr, bmpFactory, scene);
    }
    hasClass(className: string): VmBool {
        return this.classesData.get(className) ? 1 : 0;
    }
    getClassDir(className: string): string {
        const cl = this.classesData.get(className);
        if (!cl) return "";
        const idx = cl.fileName.lastIndexOf("\\");
        return cl.fileName.substr(0, idx + 1);
    }
    *getClassesByProtoName(className: string): IterableIterator<ClassSchemeNode> {
        //TODO: ПЕРЕПИСАТЬ
        for (const node of this.classNodes) if (node.protoName === className) yield node;
    }
}
