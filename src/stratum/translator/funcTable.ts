import { Enviroment, GraphicsFunctions, ProjectFunctions, SchemaFunctions } from ".";

const schemaFuncs: (keyof SchemaFunctions)[] = [
    "getClassName",
    "getHObject",
    "setVar",
    "sendMessage",
    "setCapture",
    "releaseCapture",
    "registerObject",
    "unregisterObject",
];
const projectFuncs: (keyof ProjectFunctions)[] = [
    "closeAll",
    "openSchemeWindow",
    "loadSpaceWindow",
    "createObjectFromFile2D",
    "createDIB2d",
    "createDoubleDib2D",
    "getClassDirectory",
    "fileExist",
];
const graphicsFuncs: (keyof GraphicsFunctions)[] = [
    "getAsyncKeyState",

    // Пространства
    "getWindowName",
    "getWindowSpace",
    "getSpaceOrg2dx",
    "getSpaceOrg2dy",
    "setSpaceOrg2d",
    "getScaleSpace2d",
    "setScaleSpace2d",

    // Общие операции над объектами пространства
    "getObjectOrg2dx",
    "getObjectOrg2dy",
    "setObjectOrg2d",

    "rotateObject2d",

    "getActualWidth2d",
    "getActualHeight2d",
    "getObjectWidth2d",
    "getObjectHeight2d",
    "setObjectSize2d",

    "getZOrder2d",
    "setZOrder2d",

    "setObjectName2d",
    "setShowObject2d",
    "objectToTop2d",
    "deleteObject2d",

    // Группы
    "createGroup2d",
    "getGroupItem2d",
    "delGroupItem2d",
    "getObject2dByName",
    "getObjectParent2d",
    "deleteGroup2d",

    // Прочее
    "getObjectFromPoint2d",
    "isObjectsIntersect2d",

    // Объект Polyline
    "createPolyLine2d",
    "createLine2d",

    "addPoint2d",
    "getVectorPoint2dx",
    "getVectorPoint2dy",
    "setVectorPoint2d",

    "getPenObject2d",
    "getBrushObject2d",

    // Объект Текст
    "createRasterText2D",
    "getTextObject2d",
    "getControlText2d",
    "setControlText2d",

    // Объект битмап
    "createBitmap2d",
    "createDoubleBitmap2D",
    "setBitmapSrcRect2d",

    // Инструмент битмпап

    // Инструмент Pen
    "createPen2d",
    "getPenStyle2d",
    "setPenStyle2d",
    "getPenWidth2d",
    "setPenWidth2d",
    "getPenColor2d",
    "setPenColor2d",
    "getPenRop2d",
    "setPenRop2d",

    // Инструмент Brush
    "createBrush2d",
    "getBrushStyle2d",
    "setBrushStyle2d",
    "getBrushHatch2d",
    "setBrushHatch2d",
    "getBrushColor2d",
    "setBrushColor2d",
    "getBrushRop2d",
    "setBrushRop2d",

    // Инструмент Текст
    "createText2D",
    "getTextCount2d",
    "getTextFont2d",
    "getTextString2d",
    "getTextFgColor2d",
    "getTextBkColor2d",
    "setText2D",

    // Инструмент Строка
    "createString2D",
    "getstring2d",
    "setString2d",

    // Инструмент Шрифт
    "createFont2D",

    // Окна
    "getWindowProp",
    "isWindowExist",
    "getWindowOrgX",
    "getWindowOrgY",
    "setWindowOrg",
    "getWindowWidth",
    "getWindowHeight",
    "getClientWidth",
    "getClientHeight",
    "setClientSize",
    "showWindow",
    "closeWindow",
    "bringWindowToTop",
    "setWindowTransparent",
    "setWindowTransparentColor",
    "setWindowOwner",
    "getScreenWidth",
    "getScreenHeight",
    "getWorkAreaX",
    "getWorkAreaY",
    "getWorkAreaWidth",
    "getWorkAreaHeight",
];

export const schemaVarName = "schema";
export const projectVarName: keyof Enviroment = "project";
export const graphicsVarName: keyof Enviroment = "graphics";

export const funcTable = new Map([
    ["ROUND", "roundPrec"],
    ["ADDSLASH", "addSlash"],
    ["NEW", "env.newArray"],
    ["MCISENDSTRING", "env.MCISendString"],
    ["GETTICKCOUNT", "env.getTickCount"],
    ...schemaFuncs.map((c): [string, string] => [c.toUpperCase(), `${schemaVarName}.${c}`]),
    ...projectFuncs.map((c): [string, string] => [c.toUpperCase(), `${projectVarName}.${c}`]),
    ...graphicsFuncs.map((c): [string, string] => [c.toUpperCase(), `${graphicsVarName}.${c}`]),
]);
