import { ClassData } from "cls-types";
import { ProjectFile } from "other-types";
import { VectorDrawData } from "vdr-types";
import { ProjectController, VmBool } from "vm-interfaces-core";
import { readVectorDrawData } from "~/fileReader/deserialization";
import { BinaryStream } from "~/helpers/binaryStream";
import { createComposedScheme } from "~/helpers/graphics";
import { ClassTreeNode } from "./classTreeNode";

export interface ProjectData {
    allClasses: ClassTreeNode[];
    classesData: Map<string, ClassData>;
    projectFiles?: ProjectFile[];
}

export interface ProjectOptions {
    debug_disableSchemeCompose?: boolean;
}

export class Project implements ProjectController {
    private classNodes: ClassTreeNode[];
    private classNodeCache = new Map<string, ClassTreeNode[]>();
    private classesData: Map<string, ClassData>;
    private files?: ProjectFile[];
    private disableSchemeCompose: boolean;

    constructor(data: ProjectData, options?: ProjectOptions) {
        this.files = data.projectFiles;
        this.classNodes = data.allClasses;
        this.classesData = data.classesData;
        this.disableSchemeCompose = (options && options.debug_disableSchemeCompose) || false;
    }

    getClassScheme(className: string): VectorDrawData | undefined {
        const data = this.classesData.get(className);
        if (!data || !data.scheme) return undefined;
        //TODO: закешировать скомпозированную схему.
        const { scheme, childInfo } = data;
        if (childInfo && !this.disableSchemeCompose) return createComposedScheme(scheme, childInfo, this.classesData);
        else return scheme;
    }

    loadSchemeFromFile(fileName: string): VectorDrawData | undefined {
        if (!this.files) return undefined;
        const name = fileName
            .split("\\")
            .filter((n) => n)
            .join("\\")
            .toLowerCase();
        const file = this.files.find((f) => f.filename.toLowerCase() === name);
        return file && readVectorDrawData(new BinaryStream(file.data));
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
    getClassesByProtoName(className: string): ClassTreeNode[] {
        const nodes = this.classNodeCache.get(className);
        if (nodes) return nodes;
        const nodes2 = this.classNodes.filter((n) => n.protoName === className);
        this.classNodeCache.set(className, nodes2);
        return nodes2;
    }
}
