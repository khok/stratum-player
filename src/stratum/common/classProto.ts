import { parseVarValue } from "stratum/common/parseVarValue";
import { ClassInfoBody, readClsFileBody, readClsFileHeader, VarType } from "stratum/fileFormats/cls";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { ClassModel, translate } from "stratum/translator";

type LazyBody =
    | {
          loaded: true;
          data: ClassInfoBody<unknown>;
      }
    | {
          loaded: false;
          stream: BinaryStream;
      };

export interface ClassProtoVars {
    count: number;
    nameUCToId: Map<string, number>;
    types: VarType[];
    defaultValues: (string | number | undefined)[];
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

    readonly name: string;
    readonly filepathDos: string;
    readonly directoryDos: string;
    readonly byteSize: number;

    constructor(stream: BinaryStream) {
        const path = (this.filepathDos = stream.meta.filepathDos || "");
        this.directoryDos = path.substring(0, path.lastIndexOf("\\") + 1);
        this.byteSize = stream.size;
        const header = readClsFileHeader(stream);
        this.name = header.name;
        stream.meta.fileversion = header.version;
        this.__body = { loaded: false, stream };
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

    get scheme() {
        return this.body.scheme;
    }

    private _vars?: ClassProtoVars;

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

    get vars() {
        if (this._vars !== undefined) return this._vars;
        const raw = this.body.vars;
        if (!raw) return undefined;

        const namesUC = raw.map((v) => v.name.toUpperCase());
        const types = raw.map((v) => v.type);
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
            defaultValues: raw.map((v) => (v.defaultValue !== "" ? parseVarValue(v.type, v.defaultValue) : undefined)),
        });
    }

    private compiled = false;
    private _model?: ClassModel;
    get model() {
        if (this.compiled === true) return this._model;

        const { sourceCode } = this.body;
        if (sourceCode === undefined) {
            this.compiled = true;
            return undefined;
        }
        this._model = translate(sourceCode, this.vars, this.name);
        this.compiled = true;
        return this._model;
    }

    private get body() {
        const { __body } = this;
        if (__body.loaded) return __body.data;

        console.log(`Читаем ${this.name} (${__body.stream.meta.filepathDos})`);
        const body = readClsFileBody(__body.stream, this.name, ClassProto.blocks);
        this.__body = {
            loaded: true,
            data: body,
        };
        return body;
    }
}
