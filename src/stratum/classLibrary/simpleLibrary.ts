import { ClassModel } from "stratum/compiler";
import { ClassInfo } from "stratum/fileFormats/cls";
import { ClassLibrary } from "./classLibraryTypes";
import { ClassProto } from "./classProto";

// abstract class SchemesLibrary implements ClassLibrary {
//     abstract has(className: string): boolean;
//     abstract get(className: string): ClassProto | null;
//     abstract getDirectory(className: string): string | null;
//     abstract getFileName(className: string): string | null;
//     getComposedScheme(className: string): VectorDrawing | null {
//         const cl = this.get(className);
//         if (!cl) return null;
//         const scheme = cl?.scheme();
//         if (!scheme) return null;
//         if (!cl.children) return scheme;

//         const merger = new VdrMerger(scheme);
//         for (let i = 0; i < cl.children.length; ++i) {
//             const child = cl.children[i];

//             const childProto = this.get(child.classname);
//             if (!childProto) throw Error(`Подимидж ${child.classname} #${child.handle} не найден на схеме ${className}`);

//             const icon = childProto.iconFile;
//             if (icon) {
//                 merger.replaceIcon(child.handle, icon, childProto.iconIndex);
//             }

//             if (!childProto.alwaysUseIcon) {
//                 const img = childProto.image();
//                 if (img) merger.insertChildImage(child.handle, img);
//             }
//         }
//         return merger.result();
//     }
// }

export class SimpleLibrary implements ClassLibrary {
    private readonly lib: Map<string, ClassProto>;
    constructor(info: ClassInfo[]) {
        const data: [string, ClassProto][] = info.map((p) => [p.name.toUpperCase(), new ClassProto(p, this)]);
        this.lib = new Map(data);
    }
    has(className: string): boolean {
        return this.lib.has(className.toUpperCase());
    }
    get(className: string): ClassProto | null {
        return this.lib.get(className.toUpperCase()) ?? null;
    }
    getModel(className: string): ClassModel | null {
        return this.get(className)?.model() ?? null;
    }
    getPath(): string | null {
        throw new Error("Method not implemented.");
    }
    [Symbol.iterator]() {
        return this.lib.values();
    }
}

// export class GlobalClassLibrary implements ClassLibrary {
//     private libs: Set<ClassLibrary>;

//     constructor(...lib: ClassLibrary[]) {
//         this.libs = new Set();
//         for (const c of lib) this.add(c);
//     }
//     getDirectory(className: string): string | null {
//         throw new Error("Method not implemented.");
//     }
//     getFileName(className: string): string | null {
//         throw new Error("Method not implemented.");
//     }

//     add(lib: ClassLibrary): this {
//         if (this.libs.has(lib)) return this;
//         for (const newClass of lib) {
//             const nameUC = newClass.name;
//             if (this.get(nameUC)) {
//                 const files = [...this].filter((c) => c.name.toUpperCase() === nameUC).map((c) => c.filePath);
//                 throw Error(`Конфликт имен имиджей: "${newClass.name}" обнаружен в файлах:\n${files.join(";\n")}.`);
//             }
//         }
//         this.libs.add(lib);
//         return this;
//     }

//     remove(lib: ProjectClassLibrary): this {
//         this.libs.delete(lib);
//         return this;
//     }

//     get(className: string): ClassProto | null {
//         for (const l of this.libs) {
//             const res = l.get(className);
//             if (res) return res;
//         }
//         return null;
//     }

//     getComposedScheme(className: string): VectorDrawing | null {
//         for (const l of this.libs) {
//             const res = l.getComposedScheme(className);
//             if (res) return res;
//         }
//         return null;
//     }

//     *[Symbol.iterator]() {
//         for (const l of this.libs) {
//             yield* l;
//         }
//     }
// }

// export class ProjectClassLibrary implements ClassLibrary {
//     private readonly lib: Map<string, ClassProto>;
//     constructor(classes: ClassProto[]) {
//         const lib = (this.lib = new Map<string, ClassProto>());
//         for (const p of classes) {
//             const keyUC = p.name.toUpperCase();
//             const prev = lib.size;
//             lib.set(keyUC, p);
//             if (lib.size === prev) {
//                 const files = classes.filter((c) => c.name.toUpperCase() === keyUC).map((c) => c.filePath);
//                 throw Error(`Конфликт имен имиджей: "${p.name}" обнаружен в файлах:\n${files.join(";\n")}.`);
//             }
//         }
//     }

//     get(className: string): ClassProto | null {
//         return this.lib.get(className.toUpperCase()) ?? null;
//     }

//     getComposedScheme(className: string): VectorDrawing | null {
//         const cl = this.get(className);
//         if (!cl?.scheme) return null;
//         if (!cl.children) return cl.scheme;

//         // TODO: закешировать результат.
//         const merger = new VdrMerger(cl.scheme);

//         for (const child of cl.children) {
//             const childClassData = this.get(child.classname);
//             if (!childClassData) throw Error(`Подимидж ${child.classname} #${child.handle} не найден.`);
//             const { handle: rootGroupHandle } = child;
//             if (childClassData.iconFile) merger.replaceIcon(rootGroupHandle, childClassData.iconFile, childClassData.iconIndex || 0);
//             if (childClassData.image && !childClassData.alwaysUseIcon) merger.insertChildImage(rootGroupHandle, childClassData.image);
//         }

//         return merger.result();
//     }

//     [Symbol.iterator]() {
//         return this.lib.values();
//     }
// }
