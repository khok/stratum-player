import { ClassInfoBody, readClsFileBody, readClsFileHeader } from "stratum/fileFormats/cls";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { ProjectMemory, Schema } from "stratum/project";
import { translate } from "stratum/translator";
import { ClassLibrary } from "./classLibrary";
import { parseVarValue } from "./parseVarValue";
import { VarType } from "./varType";

type LazyBody =
    | {
          loaded: true;
          data: ClassInfoBody<unknown>;
      }
    | {
          loaded: false;
          reader: BinaryReader;
      };

export interface ClassVars {
    count: number;
    nameUCToId: Map<string, number>;
    types: VarType[];
    flags: number[];
    defaultValues: (string | number | undefined)[];
}

export interface ClassModel {
    model: (schema: Schema, TLB: ArrayLike<number>, mem: ProjectMemory, retCode: number) => number;
    isFunction: boolean;
}

/*
 * Прототип имиджа, обертка над более низкоуровневыми функциями чтения содержимого имиджа.
 * Реализует ленивую подгрузку данных.
 */
export class ClassProto {
    private static blocks = {
        readScheme: true,
        readImage: true,
    };

    private __body: LazyBody;
    private version: number;

    readonly name: string;
    readonly filepathDos: string;
    readonly directoryDos: string;
    readonly byteSize: number;

    constructor(reader: BinaryReader) {
        const path = (this.filepathDos = reader.name);
        this.directoryDos = path.substring(0, path.lastIndexOf("\\") + 1);
        this.byteSize = reader.size();
        const header = readClsFileHeader(reader);
        this.name = header.name;
        this.version = header.version;
        this.__body = { loaded: false, reader: reader };
    }

    get children() {
        return this.body.children;
    }

    get links() {
        return this.body.links;
    }

    get image() {
        return this.body.image;
    }

    get iconFile() {
        return this.body.iconFile;
    }

    get iconIndex() {
        return this.body.iconIndex;
    }

    get scheme() {
        return this.body.scheme;
    }

    alwaysUseIcon() {
        return (this.body.flags || 0) & 4096;
    }

    private _vars?: ClassVars;

    _enableVarId: number = -1;
    _disableVarId: number = -1;
    msgVarId: number = -1;
    _hobjectVarId: number = -1;
    iditemVarId: number = -1;
    wnotifycodeVarId: number = -1;
    nwidthVarId: number = -1;
    nheightVarId: number = -1;
    xposVarId: number = -1;
    yposVarId: number = -1;
    fwkeysVarId: number = -1;

    orgxVarId: number = -1;
    orgyVarId: number = -1;
    _objnameVarId: number = -1;
    _classnameVarId: number = -1;

    flags(): number {
        return this.body.flags ?? 0;
    }

    get vars(): ClassVars {
        if (typeof this._vars !== "undefined") return this._vars;
        const raw = this.body.vars;
        if (!raw) {
            return (this._vars = {
                count: 0,
                nameUCToId: new Map(),
                defaultValues: [],
                types: [],
                flags: [],
            });
        }

        const namesUC = raw.map((v) => v.name.toUpperCase());
        const types = raw.map((v) => {
            switch (v.type) {
                case "FLOAT":
                case "INTEGER":
                    return VarType.Float;
                case "HANDLE":
                    return VarType.Handle;
                case "STRING":
                    return VarType.String;
                case "COLORREF":
                    return VarType.ColorRef;
            }
        });
        for (let i = 0; i < raw.length; i++) {
            const nameUC = namesUC[i];
            const typ = types[i];

            if (nameUC === "_ENABLE" && typ === VarType.Float) {
                this._enableVarId = i;
            } else if (nameUC === "_DISABLE" && typ === VarType.Float) {
                this._disableVarId = i;
            } else if (nameUC === "MSG" && typ === VarType.Float) {
                this.msgVarId = i;
            } else if (nameUC === "_HOBJECT" && typ === VarType.Handle) {
                this._hobjectVarId = i;
            } else if (nameUC === "IDITEM" && typ === VarType.Float) {
                this.iditemVarId = i;
            } else if (nameUC === "WNOTIFYCODE" && typ === VarType.Float) {
                this.wnotifycodeVarId = i;
            } else if (nameUC === "NWIDTH" && typ === VarType.Float) {
                this.nwidthVarId = i;
            } else if (nameUC === "NHEIGHT" && typ === VarType.Float) {
                this.nheightVarId = i;
            } else if (nameUC === "XPOS" && typ === VarType.Float) {
                this.xposVarId = i;
            } else if (nameUC === "YPOS" && typ === VarType.Float) {
                this.yposVarId = i;
            } else if (nameUC === "FWKEYS" && typ === VarType.Float) {
                this.fwkeysVarId = i;
            } else if (nameUC === "ORGX" && typ === VarType.Float) {
                this.orgxVarId = i;
            } else if (nameUC === "ORGY" && typ === VarType.Float) {
                this.orgyVarId = i;
            } else if (nameUC === "_OBJNAME" && typ === VarType.String) {
                this._objnameVarId = i;
            } else if (nameUC === "_CLASSNAME" && typ === VarType.String) {
                this._classnameVarId = i;
            }
        }

        return (this._vars = {
            count: raw.length,
            nameUCToId: new Map(namesUC.map((n, idx) => [n, idx])),
            types,
            defaultValues: raw.map((v, i) => (v.defaultValue !== "" ? parseVarValue(types[i], v.defaultValue) : undefined)),
            flags: raw.map((v) => v.flags),
        });
    }

    private compiled = false;
    private _model?: ClassModel;
    model(lib: ClassLibrary): ClassModel | undefined {
        if (this.compiled === true) return this._model;
        this.compiled = true;
        const src = this.body.sourceCode;
        if (!src) return undefined;
        return (this._model = translate(src, this.vars, this.name, lib));
    }

    private get body() {
        const { __body } = this;
        if (__body.loaded) return __body.data;

        console.log(`Читаем ${this.name} (${__body.reader.name})`);
        const body = readClsFileBody(__body.reader, this.name, this.version, ClassProto.blocks);
        this.__body = {
            loaded: true,
            data: body,
        };
        return body;
    }
}
