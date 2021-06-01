import { VdrMerger } from "stratum/common/vdrMerger";
import { ClassModel, translate } from "stratum/compiler";
import { ClassChildInfo, ClassInfo, ClassLinkInfo } from "stratum/fileFormats/cls";
import { EntryCode } from "stratum/fileFormats/entryCode";
import { readVdrFile, VectorDrawing } from "stratum/fileFormats/vdr";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { ClassFactory, ClassLibrary } from "./classLibraryTypes";
import { ClassVars } from "./classVars";

/*
 * Прототип имиджа, обертка над более низкоуровневыми функциями чтения содержимого имиджа.
 * Реализует ленивую подгрузку данных.
 */
export class ClassProto {
    readonly name: string;

    readonly children: ClassChildInfo[];
    readonly links: ClassLinkInfo[];
    private _schemeBytes: Uint8Array | null | string;
    private _scheme: VectorDrawing | null;
    private _imageBytes: Uint8Array | null | string;
    private _image: VectorDrawing | null;
    readonly iconFile: string | null;
    readonly iconIndex: number;
    private sourceCode: string | null;
    private readonly _vars: ClassVars;

    // readonly isFunction;

    readonly lib: ClassLibrary;
    readonly alwaysUseIcon: boolean;
    readonly isStruct: boolean;

    constructor(info: ClassInfo, lib: ClassLibrary) {
        this.name = info.name;
        this.children = info.children ?? [];
        this.links = info.links ?? [];
        this._schemeBytes = info.scheme ?? null;
        this._scheme = null;
        this._imageBytes = info.image ?? null;
        this._image = null;
        this.iconFile = info.iconFile ?? null;
        this.iconIndex = info.iconIndex ?? 0;
        this.sourceCode = info.sourceCode ?? null;
        this._vars = new ClassVars(info.vars);

        const flags = info.flags ?? 0;
        this.alwaysUseIcon = !!(flags & EntryCode.CF_USEDEFICON);
        this.isStruct = !!(flags & EntryCode.CF_STRUCTURE);
        // this.isFunction = !!(flags & EntryCode.CF_PROCEDURE);
        this.lib = lib;
    }

    vars(): ClassVars {
        return this._vars;
    }

    scheme(): VectorDrawing | null {
        const scheme = this._scheme;
        if (scheme) return scheme;
        const bytes = this._schemeBytes;
        if (!bytes) return null;
        this._schemeBytes = null;

        const descr = `Схема ${this.name}`;
        if (typeof bytes === "string") {
            throw Error(`${descr}: ошибка чтения.\nПричина: чтение внешних VDR (${bytes}) не реализовано.`);
        }

        const reader = new BinaryReader(bytes, descr);
        const vdr = readVdrFile(reader, { origin: "class", name: this.name });

        const children = this.children;
        if (!children) return (this._scheme = vdr);

        const merger = new VdrMerger(vdr);
        for (let i = 0; i < children.length; ++i) {
            const child = children[i];

            const childProto = this.lib.get(child.classname);
            if (!childProto) {
                console.warn(`Подимидж ${child.classname} #${child.handle} не найден на схеме ${this.name}`);
                continue;
            }

            const icon = childProto.iconFile;
            if (icon) {
                merger.replaceIcon(child.handle, icon, childProto.iconIndex);
            }

            if (!childProto.alwaysUseIcon) {
                const img = childProto.image();
                if (img) merger.insertChildImage(child.handle, img);
            }
        }
        return (this._scheme = merger.result());
    }

    private image(): VectorDrawing | null {
        const img = this._image;
        if (img) return img;
        const bytes = this._imageBytes;
        if (!bytes) return null;
        this._imageBytes = null;

        const descr = `Изображение ${this.name}`;
        if (typeof bytes === "string") {
            throw Error(`${descr}: ошибка чтения.\nПричина: чтение внешних VDR (${bytes}) не реализовано.`);
        }

        const reader = new BinaryReader(bytes, descr);
        return (this._image = readVdrFile(reader, { origin: "class", name: this.name }));
    }

    setCode(code: string): void {
        if (this.sourceCode === code) return;
        this._model = translate(code, this.lib, this.name, this._vars.toArray());
        this.sourceCode = code;
    }

    private _model: ClassModel | null = null;
    private _compiled = false;
    hasModel(): boolean {
        return !!this.sourceCode;
    }
    model(): ClassModel | null {
        if (this._compiled) return this._model;
        // Позволяет защититься от рекурсивной компиляции.
        this._compiled = true;
        const src = this.sourceCode;
        if (!src) return null;
        return (this._model = translate(src, this.lib, this.name, this._vars.toArray()));
    }

    schema<T>(factory: ClassFactory<T>, placement?: ClassChildInfo): T {
        const children = this.children.map((child) => {
            const childProto = this.lib.get(child.classname);
            if (!childProto) throw Error(`Имидж "${child.classname}" не найден.`);
            return childProto.schema(factory, child);
        });
        return factory(this, children, this.links, placement);
    }
}
