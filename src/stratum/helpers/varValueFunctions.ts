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
            return stringToColorref(value);
    }
}

export function stringToColorref(value: string) {
    const val = value.toLowerCase().trim();
    if (val.startsWith("transparent")) return 255;

    if (val.startsWith("syscolor")) return 255 * 255 * 255 * 255;

    const values = new Uint8Array(3);
    if (val.trim().startsWith("rgb")) {
        let state = 0,
            start = 0,
            compIdx = 0;
        for (let i = 3; i < val.length && state < 3; i++) {
            switch (state) {
                case 0:
                    if (val[i] === "(") {
                        state = 1;
                        start = i + 1;
                    }
                    break;
                case 1:
                    if (val[i] === "," || val[i] === ")") {
                        values[compIdx++] = parseInt(val.substring(start, i));
                        start = i + 1;
                        if (compIdx === 3) state = 3;
                    }
                    break;
            }
        }
    }
    // console.log(value, values);
    // console.log((values[0] << 24) | (values[1] << 16) | (values[2] << 8));
    return (values[0] << 24) | (values[1] << 16) | (values[2] << 8);
}

export function colorrefToString(colorref: number) {
    if (colorref & 255) return "rgba(0,0,0,0)";
    const r = (colorref >> 24) & 255;
    const g = (colorref >> 16) & 255;
    const b = (colorref >> 8) & 255;
    return `rgb(${r},${g},${b})`;
}

// console.log(colorrefToString(stringToColorref("RgB(21,    35,255    )")));
