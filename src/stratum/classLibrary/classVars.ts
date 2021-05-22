import { Constant } from "stratum/common/constant";
import { parseVarValue } from "stratum/common/parseVarValue";
import { VarType } from "stratum/common/varType";
import { ClassVarInfo } from "stratum/fileFormats/cls";

export interface VariableData {
    readonly type: VarType;
    readonly typeString: string;
    readonly description: string;
    readonly name: string;
    readonly isReturnValue: boolean;
    readonly rawFlags: number;
    readonly rawDefaultValue: string;
    readonly defaultValue: string | number | null;
}

export class ClassVars {
    private readonly nameUCToId: Map<string, number>;
    private readonly vdata: VariableData[];

    readonly _enableVarId: number = -1;
    readonly _disableVarId: number = -1;
    readonly msgVarId: number = -1;
    readonly _hobjectVarId: number = -1;
    readonly iditemVarId: number = -1;
    readonly wnotifycodeVarId: number = -1;
    readonly nwidthVarId: number = -1;
    readonly nheightVarId: number = -1;
    readonly xposVarId: number = -1;
    readonly yposVarId: number = -1;
    readonly fwkeysVarId: number = -1;
    readonly orgxVarId: number = -1;
    readonly orgyVarId: number = -1;
    readonly _objnameVarId: number = -1;
    readonly _classnameVarId: number = -1;
    readonly wVkeyVarId: number = -1;
    readonly repeatVarId: number = -1;
    readonly scanCodeVarId: number = -1;

    constructor(raw?: ClassVarInfo[] | null) {
        if (!raw) {
            this.nameUCToId = new Map();
            this.vdata = [];
            return;
        }
        this.vdata = raw.map((r): VariableData => {
            let type: VarType;
            let typeString: string;
            switch (r.type) {
                case "FLOAT":
                case "INTEGER":
                    typeString = "FLOAT";
                    type = VarType.Float;
                    break;
                case "HANDLE":
                    typeString = r.type;
                    type = VarType.Handle;
                    break;
                case "STRING":
                    typeString = r.type;
                    type = VarType.String;
                    break;
                case "COLORREF":
                    typeString = r.type;
                    type = VarType.ColorRef;
                    break;
            }
            const defaultValue = r.defaultValue.length > 0 ? parseVarValue(type, r.defaultValue) : null;
            return {
                name: r.name,
                type,
                defaultValue,
                isReturnValue: !!(r.flags & Constant.VF_RETURN),
                typeString,
                description: r.description,
                rawFlags: r.flags,
                rawDefaultValue: r.defaultValue,
            };
        });

        const namesUC = raw.map((v) => v.name.toUpperCase());
        this.nameUCToId = new Map(namesUC.map((n, idx) => [n, idx]));

        for (let i = 0; i < raw.length; ++i) {
            const nameUC = namesUC[i];
            const typ = this.vdata[i].type;

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
            } else if (nameUC === "WVKEY" && typ === VarType.Float) {
                this.wVkeyVarId = i;
            } else if (nameUC === "REPEAT" && typ === VarType.Float) {
                this.repeatVarId = i;
            } else if (nameUC === "SCANCODE" && typ === VarType.Float) {
                this.scanCodeVarId = i;
            }
        }
    }
    id(name: string): number | null {
        return this.nameUCToId.get(name.toUpperCase()) ?? null;
    }
    get(name: string): VariableData | null {
        const id = this.nameUCToId.get(name.toUpperCase());
        if (typeof id === "undefined") return null;
        return this.vdata[id];
    }
    data(id: number): VariableData {
        return this.vdata[id];
    }
    count(): number {
        return this.vdata.length;
    }
    toArray(): ReadonlyArray<VariableData> {
        return this.vdata;
    }
}
