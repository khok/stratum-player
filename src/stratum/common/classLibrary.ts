import { VectorDrawing } from "stratum/fileFormats/vdr";
import { ClassProto } from "./classProto";
import { VdrMerger } from "./vdrMerger";

interface ClassLibraryValue {
    cls: ClassProto;
    id: number;
}

export class ClassLibrary {
    private lib = new Map<string, ClassLibraryValue>();
    add(classes: ClassProto[], id: number = 0): this {
        for (const cls of classes) {
            const keyUC = cls.name.toUpperCase();
            // const prev = this.lib.size;

            const exCls = this.lib.get(keyUC);
            if (exCls) {
                if (exCls.cls.filepathDos === cls.filepathDos) continue;
                throw Error(`Конфликт имен имиджей: "${cls.name}" обнаружен в файлах:\n${cls.filepathDos},${exCls.cls.filepathDos}.`);
            }
            this.lib.set(keyUC, { cls, id });
            // if (this.lib.size === prev) {
            //     const files = classes.filter((c) => c.name.toUpperCase() === keyUC).map((c) => c.filepathDos);
            //     throw Error(`Конфликт имен имиджей: "${cls.name}" обнаружен в файлах:\n${files.join(";\n")}.`);
            // }
        }
        return this;
    }

    remove(id: number): this {
        if (id === 0) return this;
        this.lib = new Map([...this.lib].filter((v) => v[1].id !== id));
        return this;
    }

    get(className: string): ClassProto | undefined {
        return this.lib.get(className.toUpperCase())?.cls;
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
