const arccos = `function arccos(a) {
    if (a > 1) return 0;
    if (a < -1) return Math.PI;
    return Math.acos(a) || 0;
}`;
const arcsin = `function arcsin(a) {
    if (a > 1) return Math.PI / 2;
    if (a < -1) return -Math.PI / 2;
    return Math.asin(a) || 0;
}`;
const compareI = `function compareI(s1, s2, n) {
    return s1.substring(0, n) === s2.substring(0, n) ? 1 : 0;
}`;
const getAngleByXY = `function getAngleByXY(x, y) {
    if (y === 0) return x >= 0 ? 0 : Math.PI;
    if (y > 0) return -Math.atan(x / y) + Math.PI / 2;
    return -Math.atan(x / y) + Math.PI * 1.5;
}`;
const lg = `function lg(a) {
    return a > 0 ? (Math.log(a) || 0) / Math.LN10 : -(10 ** 100);
}`;
const ln = `function ln(a) {
    return a > 0 ? Math.log(a) || 0 : -(10 ** 100);
}`;
const log = `function log(a, b) {
    return a > 0 && b > 0 ? Math.log(b) / Math.log(a) || 0 : -(10 ** 100);
}`;
const pos = `function pos(s1, s2, n) {
    if (s2 === "") return -1;
    var idx = -1;
    var srch = 0;
    for (var i = 0; i < n; ++i) {
        idx = s1.indexOf(s2, srch);
        if (idx < 0) return -1;
        srch = idx + s2.length;
    }
    return idx;
}`;
const right = `function right(a, n) {
    return a.substring(a.length - n);
}`;
const round = `function round(a, b) {
    var pw = Math.ceil(10 ** b);
    return Math.round(a * pw + Number.EPSILON) / pw || 0;
}`;

export const moreFunctions = new Map<string, string>([
    ["arccos", arccos],
    ["arcsin", arcsin],
    ["compareI", compareI],
    ["getAngleByXY", getAngleByXY],
    ["lg", lg],
    ["ln", ln],
    ["log", log],
    ["pos", pos],
    ["right", right],
    ["round", round],
]);
