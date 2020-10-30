import { ClassVarType } from "stratum/fileFormats/cls";
import { parseColorRef } from "./colorrefParsers";
import { VarCode } from "./varCode";

export function parseVarType(type: ClassVarType): VarCode {
    switch (type) {
        case "FLOAT":
            return VarCode.Float;
        case "HANDLE":
            return VarCode.Handle;
        case "STRING":
            return VarCode.String;
        case "COLORREF":
            return VarCode.ColorRef;
    }
}

export function parseVarValue(type: VarCode, value: string): string | number {
    switch (type) {
        case VarCode.String:
            return value;
        case VarCode.Float:
            return parseFloat(value) || 0;
        case VarCode.Handle:
            return (value.startsWith("#") ? parseInt(value.substring(1, value.length)) : parseInt(value)) || 0;
        case VarCode.ColorRef:
            return parseColorRef(value);
    }
}
