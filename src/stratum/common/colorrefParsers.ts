/*
 * Функции для парсинга и преобразования типа данных `ColorRef`.
 */

import { BadDataError } from "stratum/helpers/errors";

const systemColorTable = [
    "gray",
    "blue",
    "navy",
    "gray",
    "#b5b5b5",
    "white",
    "black",
    "black",
    "black",
    "white",
    "gray",
    "gray",
    "gray",
    "navy",
    "white",
    "#b5b5b5",
    "gray",
    "gray",
    "black",
    "gray",
    "white",
];

const transparentFlag = 1 << 24;
const syscolorFlag = 2 << 24;

/**
 * Преобразует строку вида `transparent` / `syscolor(X)` / `rgb(X,Y,Z)` в числовое значение ColorRef.
 *
 * Используется при парсинге дефолтных переменных имиджа.
 */
export function parseColorRef(value: string) {
    const val = value.toLowerCase().trim();
    // "transparent"
    if (val.startsWith("transparent")) return transparentFlag;

    // "syscolor(14)" -> 14
    if (val.startsWith("syscolor")) return syscolorFlag | parseInt(val.split("(")[1].split(")")[0]);

    // "rgb(3,200,127)" -> 3 | (200 << 8) | (127 << 16)
    if (val.startsWith("rgb")) {
        const values = val
            .split("(")[1]
            .split(")")[0]
            .split(",")
            .map((v) => parseInt(v));
        return values[0] | (values[1] << 8) | (values[2] << 16);
    }

    throw new BadDataError(`Неизвестный цвет: ${value}`);
}

/**
 * Преобразует числовое значение colorref в понятный браузеру цвет.
 *
 * Вызывается из системы рендереринга.
 */
export function colorRefToColor(colorref: number) {
    if (colorref & transparentFlag) return "transparent";

    const r = colorref & 255;
    if (colorref & syscolorFlag) return systemColorTable[r] || "black";

    const g = (colorref >> 8) & 255;
    const b = (colorref >> 16) & 255;
    return `rgb(${r},${g},${b})`;
}
