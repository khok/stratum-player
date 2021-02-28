/*
 * Функции для парсинга и преобразования типа данных `ColorRef`.
 */

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

// const systemColorTable2: [number, number, number][] = [
//     [128, 128, 128], //"gray"
//     [0, 0, 255], //"blue"
//     [0, 0, 128], //"navy"
//     [128, 128, 128], //"gray"
//     [181, 181, 181], //"#b5b5b5"
//     [255, 255, 255], //"white"
//     [0, 0, 0], //"black"
//     [0, 0, 0], //"black"
//     [0, 0, 0], //"black"
//     [255, 255, 255], //"white"
//     [128, 128, 128], //"gray"
//     [128, 128, 128], //"gray"
//     [128, 128, 128], //"gray"
//     [0, 0, 128], //"navy"
//     [255, 255, 255], //"white"
//     [181, 181, 181], //"#b5b5b5"
//     [128, 128, 128], //"gray"
//     [128, 128, 128], //"gray"
//     [0, 0, 0], //"black"
//     [128, 128, 128], //"gray"
//     [255, 255, 255], //"white"
// ].map((e) => [e[0] / 255, e[1] / 255, e[2] / 255]);

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

    throw Error(`Неизвестный цвет: ${value}`);
}

/**
 * Преобразует числовое значение colorref в понятный браузеру цвет.
 *
 * Вызывается из системы рендереринга.
 */
export function colorrefToCSSColor(colorref: number) {
    if (colorref & transparentFlag) return "transparent";

    const r = colorref & 255;
    if (colorref & syscolorFlag) return systemColorTable[r] || "black";

    const g = (colorref >> 8) & 255;
    const b = (colorref >> 16) & 255;
    return `rgb(${r},${g},${b})`;
}

// export function colorrefToRGB(colorref: number): [number, number, number] | null {
//     if (colorref & transparentFlag) return null;

//     const r = colorref & 255;
//     if (colorref & syscolorFlag) return systemColorTable2[r] || [0, 0, 0];

//     const g = (colorref >> 8) & 255;
//     const b = (colorref >> 16) & 255;
//     return [r / 255, g / 255, b / 255];
// }
