import { NumBool } from "..";

export interface GraphicsFunctions {
    getAsyncKeyState(vkey: number): number;
    // Пространства
    getWindowName(hspace: number): string;
    getSpaceOrg2dx(hspace: number): number;
    getSpaceOrg2dy(hspace: number): number;
    setSpaceOrg2d(hspace: number, x: number, y: number): NumBool;

    getScaleSpace2d(hspace: number): number;
    setScaleSpace2d(hspace: number, ms: number): NumBool;

    // Общие операции над объектами пространства
    getObjectOrg2dx(hspace: number, hobject: number): number;
    getObjectOrg2dy(hspace: number, hobject: number): number;
    setObjectOrg2d(hspace: number, hobject: number, x: number, y: number): NumBool;

    rotateObject2d(hspace: number, hobject: number, centerX: number, centerY: number, angle: number): NumBool;

    getActualWidth2d(hspace: number, hobject: number): number;
    getActualHeight2d(hspace: number, hobject: number): number;
    getObjectWidth2d(hspace: number, hobject: number): number;
    getObjectHeight2d(hspace: number, hobject: number): number;
    setObjectSize2d(hspace: number, hobject: number, sizeX: number, sizeY: number): NumBool;

    getZOrder2d(hspace: number, hobject: number): number;
    setZOrder2d(hspace: number, hobject: number, zOrder: number): NumBool;

    setObjectName2d(hspace: number, hobject: number, name: string): NumBool;
    setShowObject2d(hspace: number, hobject: number, visible: number): NumBool;
    objectToTop2d(hspace: number, hobject: number): NumBool;
    deleteObject2d(hspace: number, hobject: number): NumBool;

    // Группы
    createGroup2d(hspace: number, ...hobject: number[]): number;
    getGroupItem2d(hspace: number, hgroup: number, index: number): number;
    delGroupItem2d(hspace: number, hgroup: number, hobject: number): NumBool;
    getObject2dByName(hspace: number, hgroup: number, name: string): number;
    getObjectParent2d(hspace: number, hobject: number): number;
    deleteGroup2d(hspace: number, hgroup: number): NumBool;

    // Прочее
    getObjectFromPoint2d(hspace: number, x: number, y: number): number;
    isObjectsIntersect2d(hspace: number, obj1: number, obj2: number, flags: number): NumBool;

    // Объект Polyline
    createPolyLine2d(hspace: number, hpen: number, hbrush: number, ...coords: number[]): number;
    createLine2d(hspace: number, hpen: number, hbrush: number, x: number, y: number): number;

    addPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool;
    getVectorPoint2dx(hspace: number, hline: number, index: number): number;
    getVectorPoint2dy(hspace: number, hline: number, index: number): number;
    setVectorPoint2d(hspace: number, hline: number, index: number, x: number, y: number): NumBool;

    getPenObject2d(hspace: number, hline: number): number;
    getBrushObject2d(hspace: number, hline: number): number;

    // Объект Текст
    createRasterText2D(hspace: number, htext: number, x: number, y: number, angle: number): number;
    getTextObject2d(hspace: number, hojbect: number): number;

    // Объект Контрол
    getControlText2d(hspace: number, hcontrol: number, begin?: number, length?: number): string;
    setControlText2d(hspace: number, hcontrol: number, text: string): NumBool;

    // Объект битмап
    createBitmap2d(hspace: number, hdib: number, x: number, y: number): number;
    createDoubleBitmap2D(hspace: number, hdib: number, x: number, y: number): number;
    setBitmapSrcRect2d(hspace: number, hobject: number, x: number, y: number, width: number, height: number): number;

    // Инструмент битмпап

    // Инструмент Pen
    createPen2d(hspace: number, style: number, width: number, color: number, rop2: number): number;
    getPenStyle2d(hspace: number, hpen: number): number;
    setPenStyle2d(hspace: number, hpen: number, style: number): NumBool;
    getPenWidth2d(hspace: number, hpen: number): number;
    setPenWidth2d(hspace: number, hpen: number, width: number): NumBool;
    getPenColor2d(hspace: number, hpen: number): number;
    setPenColor2d(hspace: number, hpen: number, color: number): NumBool;
    getPenRop2d(hspace: number, hpen: number): number;
    setPenRop2d(hspace: number, hpen: number, rop: number): NumBool;

    // Инструмент Brush
    createBrush2d(hspace: number, style: number, hatch: number, color: number, hdib: number, type: number): number;
    getBrushStyle2d(hspace: number, hbrush: number): number;
    setBrushStyle2d(hspace: number, hbrush: number, style: number): NumBool;
    getBrushHatch2d(hspace: number, hbrush: number): number;
    setBrushHatch2d(hspace: number, hbrush: number, hatch: number): NumBool;
    getBrushColor2d(hspace: number, hbrush: number): number;
    setBrushColor2d(hspace: number, hbrush: number, color: number): NumBool;
    getBrushRop2d(hspace: number, hbrush: number): number;
    setBrushRop2d(hspace: number, hbrush: number, rop: number): NumBool;

    // Инструмент Текст
    createText2D(hspace: number, hfont: number, hstring: number, fgColor: number, bgColor: number): number;
    getTextCount2d(hspace: number, htext: number): number;
    getTextFont2d(hspace: number, htext: number, index?: number): number;
    getTextString2d(hspace: number, htext: number, index?: number): number;
    getTextFgColor2d(hspace: number, htext: number, index?: number): number;
    getTextBkColor2d(hspace: number, htext: number, index?: number): number;
    setText2D(hspace: number, htext: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;
    setText2D(hspace: number, htext: number, index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool;

    // Инструмент Строка
    createString2D(hspace: number, value: string): number;
    getstring2d(hspace: number, hstring: number): string;
    setString2d(hspace: number, hstring: number, value: string): NumBool;

    // Инструмент Шрифт
    createFont2D(hspace: number, fontName: string, height: number, flags: number): number;

    // Окна
    isWindowExist(wname: string): NumBool;
    getWindowSpace(wname: string): number;
    getWindowProp(wname: string, prop: string): string;

    getWindowOrgX(wname: string): number;
    getWindowOrgY(wname: string): number;
    setWindowOrg(wname: string, orgX: number, orgY: number): NumBool;

    getWindowWidth(wname: string): number;
    getWindowHeight(wname: string): number;

    getClientWidth(wname: string): number;
    getClientHeight(wname: string): number;
    setClientSize(wname: string, width: number, height: number): NumBool;

    bringWindowToTop(wname: string): NumBool;

    showWindow(wname: string, flag: number): NumBool;
    closeWindow(wname: string): NumBool;

    setWindowTransparent(): NumBool;
    setWindowTransparentColor(): NumBool;
    setWindowOwner(): NumBool;

    // Размеры рабочей области
    getScreenWidth(): number;
    getScreenHeight(): number;
    getWorkAreaX(): number;
    getWorkAreaY(): number;
    getWorkAreaWidth(): number;
    getWorkAreaHeight(): number;
}
