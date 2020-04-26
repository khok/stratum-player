import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

/**
 * Сделать нормально
 */
export const systemKeysTemp = new Uint8Array(2);

function GetAsyncKeyState(ctx: VmStateContainer) {
    const key = ctx.popDouble();
    ctx.pushDouble(systemKeysTemp[key]);
}

function CloseAll(ctx: VmStateContainer) {
    ctx.requestStop();
}

const systemCommands: { [idx: number]: string } = {
    1: "AboutDialog",
    2: "Возвращает номер версии постройки",
    3: "Диалог с информацией о системе",
    4: "Число шагов с последнего запуска",
    6: "Прячет или показывает все инструментальные панели (0 - спрятать 1 - показать)",
    8: `Прячет или показывает строку состояния( 0 - спрятать
        1 - сверху
        2 - снизу)`,
    10: "Прячет или показывает системное меню ( 0 - спрятать 1 - показать)",
    20: `Прячет или показывает все системные элементы (строка
        состояния, инструментальные панели , системное меню).
        Строка состояния показывается снизу.
        (0 - спрятать 1 - показать)`,
    21: `Float(Hspace),
        Float(Hobject)
        Вызов диалога со свойствами двухмерного объекта`,
    22: `Float(Hspace),
        Float(Hobject)
        Вызов диалога со свойствами трехмерного объекта`,
};

function system(ctx: VmStateContainer, paramCount: number) {
    const params = new Array<number>(paramCount);
    for (let i = paramCount - 1; i >= 0; i--) params[i] = ctx.popDouble();
    const command = ctx.popDouble();
    console.warn(`Вызов System(${command}, ${params})\n${systemCommands[command]}`);
    ctx.pushDouble(1);
}

// STRING GetClassDirectory(STRING ClassName)
function GetClassDirectory(ctx: VmStateContainer) {
    const className = ctx.popString();
    ctx.pushString(ctx.project.getClassDir(className));
}

// FLOAT FileExist(STRING Name)
function FileExist(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.project.fileExist(ctx.popString()));
}

// STRING AddSlash(STRING FileName)
function AddSlash(ctx: VmStateContainer) {
    const path = ctx.popString();
    ctx.pushString(path[path.length - 1] === "\\" ? path : path + "\\");
}

function setNewDoubleValue(ctx: VmStateContainer, id: number, value: number) {
    ctx.memoryState.newDoubleValues[ctx.currentClass.doubleIdToGlobal![id]] = value;
}

function setOldDoubleValue(ctx: VmStateContainer, id: number, value: number) {
    ctx.memoryState.oldDoubleValues[ctx.currentClass.doubleIdToGlobal![id]] = value;
}

// GetDate(FLOAT &year, FLOAT &mon, FLOAT &day)
function GetDate(ctx: VmStateContainer) {
    const isDayNew = ctx.popLong();
    const dayId = ctx.popLong();
    const isMonthNew = ctx.popLong();
    const monthId = ctx.popLong();
    const isYearNew = ctx.popLong();
    const yearId = ctx.popLong();

    const time = new Date();

    if (isDayNew) setNewDoubleValue(ctx, dayId, time.getDate());
    else setOldDoubleValue(ctx, dayId, time.getDate());

    if (isMonthNew) setNewDoubleValue(ctx, monthId, time.getMonth());
    else setOldDoubleValue(ctx, monthId, time.getMonth());

    if (isYearNew) setNewDoubleValue(ctx, yearId, time.getFullYear());
    else setOldDoubleValue(ctx, yearId, time.getFullYear());
}

// GetTime(FLOAT hour, FLOAT min, FLOAT sec, FLOAT hund)
function GetTime(ctx: VmStateContainer) {
    const isMsecNew = ctx.popLong();
    const msecId = ctx.popLong();
    const isSecNew = ctx.popLong();
    const secId = ctx.popLong();
    const isMinNew = ctx.popLong();
    const minId = ctx.popLong();
    const isHourNew = ctx.popLong();
    const hourId = ctx.popLong();

    const time = new Date();

    if (isMsecNew) setNewDoubleValue(ctx, msecId, time.getMilliseconds());
    else setOldDoubleValue(ctx, msecId, time.getMilliseconds());

    if (isSecNew) setNewDoubleValue(ctx, secId, time.getSeconds());
    else setOldDoubleValue(ctx, secId, time.getSeconds());

    if (isMinNew) setNewDoubleValue(ctx, minId, time.getMinutes());
    else setOldDoubleValue(ctx, minId, time.getMinutes());

    if (isHourNew) setNewDoubleValue(ctx, hourId, time.getHours());
    else setOldDoubleValue(ctx, hourId, time.getHours());
}

// VM_GETSCREENWIDTH, name "GetScreenWidth" ret "FLOAT" out 772
function GetScreenWidth(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.screenWidth);
}
// VM_GETSCREENHEIGHT, name "GetScreenHeight" ret "FLOAT" out 773
function GetScreenHeight(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.screenHeight);
}

// VM_GETWORKAREAX, name "GetWorkAreaX" ret "FLOAT" out 774
function GetWorkAreaX(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.areaOriginX);
}
// VM_GETWORKAREAY, name "GetWorkAreaY" ret "FLOAT" out 775
function GetWorkAreaY(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.areaOriginY);
}
// VM_GETWORKAREAWIDTH, name "GetWorkAreaWidth" ret "FLOAT" out 776
function GetWorkAreaWidth(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.areaWidth);
}
// VM_GETWORKAREAHEIGHT, name "GetWorkAreaHeight" ret "FLOAT" out 777
function GetWorkAreaHeight(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.areaHeight);
}

const start = new Date().getMilliseconds();
// FLOAT GetTickCount()
function GetTickCount(ctx: VmStateContainer) {
    ctx.pushDouble(new Date().getTime() - start);
}

// StdHyperJump(HANDLE hSpace, FLOAT x, y, HANDLE hObject, FLOAT flags)
function StdHyperJump(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const handle = ctx.popLong();
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) return;
    const obj = space.getObject(handle);
    if (!obj) return;
    console.warn(`Вызов StdHyperJump(${spaceHandle}, ${x}, ${y}, ${handle}, ${flags})`);
}

export function initSystem(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETAKEYSTATE, GetAsyncKeyState);
    addOperation(Opcode.V_CLOSEALL, CloseAll);
    addOperation(Opcode.V_SYSTEM, system as Operation);

    addOperation(Opcode.VM_GETSCREENWIDTH, GetScreenWidth);
    addOperation(Opcode.VM_GETSCREENHEIGHT, GetScreenHeight);
    addOperation(Opcode.VM_GETWORKAREAX, GetWorkAreaX);
    addOperation(Opcode.VM_GETWORKAREAY, GetWorkAreaY);
    addOperation(Opcode.VM_GETWORKAREAWIDTH, GetWorkAreaWidth);
    addOperation(Opcode.VM_GETWORKAREAHEIGHT, GetWorkAreaHeight);
    addOperation(Opcode.GETCLASSDIR, GetClassDirectory);
    addOperation(Opcode.VM_FILEEXIST, FileExist);
    addOperation(Opcode.ADDSLASH, AddSlash);
    addOperation(Opcode.VM_GETDATE, GetDate);
    addOperation(Opcode.VM_GETTIME, GetTime);
    addOperation(Opcode.GETTICKCOUNT, GetTickCount);
    addOperation(Opcode.STDHYPERJUMP, StdHyperJump);
}
