import { VarData } from "cls-types";
import { colorTable } from "./colorTable";

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
export function stringToColorref(value: string) {
    const val = value.toLowerCase().trim();
    if (val.startsWith("transparent")) return 1;

    if (val.startsWith("syscolor")) {
        const color = parseInt(val.split("(")[1].split(")")[0]);
        return (color << 24) | 2;
    }

    if (val.startsWith("rgb")) {
        const values = val
            .split("(")[1]
            .split(")")[0]
            .split(",")
            .map((v) => parseInt(v));
        return (values[0] << 24) | (values[1] << 16) | (values[2] << 8);
    }

    throw new Error(`Неизвестный цвет: ${value}`);
    // const values = new Uint8Array(3);
    // if (val.startsWith("rgb")) {
    //     let state = 0,
    //         start = 0,
    //         compIdx = 0;
    //     for (let i = 3; i < val.length && state < 3; i++) {
    //         switch (state) {
    //             case 0:
    //                 if (val[i] === "(") {
    //                     state = 1;
    //                     start = i + 1;
    //                 }
    //                 break;
    //             case 1:
    //                 if (val[i] === "," || val[i] === ")") {
    //                     values[compIdx++] = parseInt(val.substring(start, i));
    //                     start = i + 1;
    //                     if (compIdx === 3) state = 3;
    //                 }
    //                 break;
    //         }
    //     }
    // }
}

/**
 * Вызывается из виртуальной машины
 */
export function colorrefToString(colorref: number) {
    if (colorref & 1) return "rgba(0,0,0,0)";
    if (colorref & 2) return colorTable[colorref & 255] || "black";
    const r = (colorref >> 24) & 255;
    const g = (colorref >> 16) & 255;
    const b = (colorref >> 8) & 255;
    return `rgb(${r},${g},${b})`;
}

// console.log(colorrefToString(stringToColorref("RgB(21,    35,255    )")));
