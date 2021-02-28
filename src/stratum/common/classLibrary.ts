import { VectorDrawing } from "stratum/fileFormats/vdr";
import { ClassProto } from "./classProto";
import { VdrMerger } from "./vdrMerger";

export class ClassLibrary {
    private readonly lib: Map<string, ClassProto>;
    constructor(classes: ClassProto[]) {
        const lib = (this.lib = new Map<string, ClassProto>());
        for (const p of classes) {
            const keyUC = p.name.toUpperCase();
            const prev = lib.size;
            lib.set(keyUC, p);
            if (lib.size === prev) {
                const files = classes.filter((c) => c.name.toUpperCase() === keyUC).map((c) => c.filepathDos);
                throw Error(`Конфликт имен имиджей: "${p.name}" обнаружен в файлах:\n${files.join(";\n")}.`);
            }
        }
    }

    get(className: string): ClassProto | undefined {
        return this.lib.get(className.toUpperCase());
    }

    getComposedScheme(className: string): VectorDrawing | undefined {
        const cl = this.get(className);
        if (!cl?.scheme) return undefined;
        if (!cl.children) return cl.scheme;

        // TODO: закешировать результат.
        const merger = new VdrMerger(cl.scheme);

        for (const child of cl.children) {
            const childClassData = this.get(child.classname);
            if (!childClassData) throw Error(`Подимидж ${child.classname} #${child.schemeInfo.handle} не найден.`);
            const { handle: rootGroupHandle } = child.schemeInfo;
            if (childClassData.iconFile) merger.replaceIcon(rootGroupHandle, childClassData.iconFile, childClassData.iconIndex || 0);
            if (childClassData.image && !childClassData.alwaysUseIcon()) merger.insertChildImage(rootGroupHandle, childClassData.image);
        }

        return merger.result;
    }
}
