import { VarType } from "stratum/fileFormats/cls";
import { parseColorRef } from "./colorrefParsers";

export function parseVarValue(type: VarType, value: string): string | number {
    switch (type) {
        case VarType.String:
            return value;
        case VarType.Float:
            return parseFloat(value) || 0;
        case VarType.Handle:
            return (value.startsWith("#") ? parseInt(value.substring(1, value.length)) : parseInt(value)) || 0;
        case VarType.ColorRef:
            return parseColorRef(value);
    }
}
