import { VarData } from "data-types-base";

export function createDefaultValue(type: VarData["type"]) {
    switch (type) {
        case "FLOAT":
            return 0;
        case "HANDLE":
            return 0;
        case "STRING":
            return "";
        case "COLORREF":
            return "rgb(0, 0, 0)";
    }
}

export function parseVarValue(type: VarData["type"], value: string): string | number {
    switch (type) {
        case "STRING":
            return value;
        case "FLOAT":
            return parseFloat(value) || 0;
        case "HANDLE":
            return (value.startsWith("#") ? parseInt(value.substring(1, value.length)) : parseInt(value)) || 0;
        case "COLORREF":
            return value;
    }
}
