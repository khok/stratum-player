import { VarData } from "cls-types";
import { systemColorTable } from "./systemColorTable";

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
            return stringToColorref(value);
    }
}

/**
 * Вызывать только при парсинге значений по умолчанию.
 */
function stringToColorref(value: string) {
    const val = value.toLowerCase().trim();
    // "transparent"
    if (val.startsWith("transparent")) return 1 << 24;

    // "syscolor(14)"
    if (val.startsWith("syscolor")) return (2 << 24) | parseInt(val.split("(")[1].split(")")[0]);

    // "rgb(2,4,16)"
    if (val.startsWith("rgb")) {
        const values = val
            .split("(")[1]
            .split(")")[0]
            .split(",")
            .map((v) => parseInt(v));
        return values[0] | (values[1] << 8) | (values[2] << 16);
    }

    throw new Error(`Неизвестный цвет: ${value}`);
}

/**
 * Вызывается из рендерера
 */
export function colorrefToColor(colorref: number) {
    const lastByte = colorref >> 24;
    if (lastByte & 1) return "transparent";

    const r = colorref & 255;
    if (lastByte & 2) return systemColorTable[r] || "black";

    const g = (colorref >> 8) & 255;
    const b = (colorref >> 16) & 255;
    return `rgb(${r},${g},${b})`;
}

// console.log(colorrefToString(stringToColorref("RgB(21,    35,255    )")));
