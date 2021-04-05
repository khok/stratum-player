import { NumBool } from "stratum/common/types";

function arccos(a: number) {
    if (a > 1) return 0;
    if (a < -1) return Math.PI;
    return Math.acos(a) || 0;
}
function arcsin(a: number): number {
    if (a > 1) return Math.PI / 2;
    if (a < -1) return -Math.PI / 2;
    return Math.asin(a) || 0;
}
function compareI(s1: string, s2: string, n: number): NumBool {
    return s1.substring(0, n) === s2.substring(0, n) ? 1 : 0;
}
function getAngleByXY(x: number, y: number): number {
    if (y === 0) return x >= 0 ? 0 : Math.PI;
    if (y > 0) return -Math.atan(x / y) + Math.PI / 2;
    return -Math.atan(x / y) + Math.PI * 1.5;
}
function lg(a: number): number {
    return a > 0 ? (Math.log(a) || 0) / Math.LN10 : -(10 ** 100);
}
function ln(a: number): number {
    return a > 0 ? Math.log(a) || 0 : -(10 ** 100);
}
function log(a: number, b: number): number {
    return a > 0 && b > 0 ? Math.log(b) / Math.log(a) || 0 : -(10 ** 100);
}
function pos(s1: string, s2: string, n: number): number {
    if (s2 === "") return -1;
    var idx = -1;
    var srch = 0;
    for (var i = 0; i < n; ++i) {
        idx = s1.indexOf(s2, srch);
        if (idx < 0) return -1;
        srch = idx + s2.length;
    }
    return idx;
}
function right(a: string, n: number): string {
    return a.substring(a.length - n);
}
function round(a: number, b: number): number {
    var pw = Math.ceil(10 ** b);
    return Math.round(a * pw + Number.EPSILON) / pw || 0;
}
export const moreFunctions = new Map<string, string>(
    [arccos, arcsin, compareI, getAngleByXY, lg, ln, log, pos, right, round].map((d) => [d.name, d.toString()])
);
