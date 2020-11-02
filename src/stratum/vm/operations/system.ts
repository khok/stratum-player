import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

/**
 * Сделать нормально
 */
export const systemKeysTemp = new Uint8Array(2);

function GetAsyncKeyState(ctx: ExecutionContext) {
    const key = ctx.popDouble();
    ctx.pushDouble(systemKeysTemp[key]);
}

function CloseAll(ctx: ExecutionContext) {
    ctx.executionStopped = true;
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

function System(ctx: ExecutionContext, argCount: number) {
    const args = new Array<number>(argCount);
    for (let i = argCount - 1; i >= 0; i--) args[i] = ctx.popDouble();
    const command = ctx.popDouble();
    console.warn(`Вызов System(${command}, ${args})\n${systemCommands[command]}`);
    ctx.pushDouble(1);
}

// STRING GetClassDirectory(STRING ClassName)
function GetClassDirectory(ctx: ExecutionContext) {
    ctx.pushString(ctx.project.getClassDirectory(ctx.popString()));
}

// FLOAT FileExist(STRING Name)
function FileExist(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.project.isFileExist(ctx.popString()));
}

// STRING AddSlash(STRING FileName)
function AddSlash(ctx: ExecutionContext) {
    const path = ctx.popString();
    ctx.pushString(path[path.length - 1] === "\\" ? path : path + "\\");
}

function setNewDoubleValue(ctx: ExecutionContext, id: number, value: number) {
    ctx.memoryManager.newDoubleValues[ctx.classVars.globalIds[id]] = value;
}

function setOldDoubleValue(ctx: ExecutionContext, id: number, value: number) {
    ctx.memoryManager.oldDoubleValues[ctx.classVars.globalIds[id]] = value;
}

// GetDate(FLOAT &year, FLOAT &mon, FLOAT &day)
function GetDate(ctx: ExecutionContext) {
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
function GetTime(ctx: ExecutionContext) {
    const isSantiNew = ctx.popLong();
    const santiId = ctx.popLong();
    const isSecNew = ctx.popLong();
    const secId = ctx.popLong();
    const isMinNew = ctx.popLong();
    const minId = ctx.popLong();
    const isHourNew = ctx.popLong();
    const hourId = ctx.popLong();

    const time = new Date();

    if (isSantiNew) setNewDoubleValue(ctx, santiId, time.getMilliseconds() * 0.1);
    else setOldDoubleValue(ctx, santiId, time.getMilliseconds());

    if (isSecNew) setNewDoubleValue(ctx, secId, time.getSeconds());
    else setOldDoubleValue(ctx, secId, time.getSeconds());

    if (isMinNew) setNewDoubleValue(ctx, minId, time.getMinutes());
    else setOldDoubleValue(ctx, minId, time.getMinutes());

    if (isHourNew) setNewDoubleValue(ctx, hourId, time.getHours());
    else setOldDoubleValue(ctx, hourId, time.getHours());
}

// VM_GETSCREENWIDTH, name "GetScreenWidth" ret "FLOAT" out 772
function GetScreenWidth(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.screenWidth);
}
// VM_GETSCREENHEIGHT, name "GetScreenHeight" ret "FLOAT" out 773
function GetScreenHeight(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.screenHeight);
}

// VM_GETWORKAREAX, name "GetWorkAreaX" ret "FLOAT" out 774
function GetWorkAreaX(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.areaOriginX);
}
// VM_GETWORKAREAY, name "GetWorkAreaY" ret "FLOAT" out 775
function GetWorkAreaY(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.areaOriginY);
}
// VM_GETWORKAREAWIDTH, name "GetWorkAreaWidth" ret "FLOAT" out 776
function GetWorkAreaWidth(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.areaWidth);
}
// VM_GETWORKAREAHEIGHT, name "GetWorkAreaHeight" ret "FLOAT" out 777
function GetWorkAreaHeight(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.areaHeight);
}

const start = new Date().getTime();
// FLOAT GetTickCount()
function GetTickCount(ctx: ExecutionContext) {
    ctx.pushDouble(new Date().getTime() - start);
}

// StdHyperJump(HANDLE hSpace, FLOAT x, y, HANDLE hObject, FLOAT flags)
function StdHyperJump(ctx: ExecutionContext) {
    const flags = ctx.popDouble();
    const handle = ctx.popLong();
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) return;
    const obj = space.getObject(handle);
    if (!obj) return;
    console.warn(`Вызов StdHyperJump(${spaceHandle}, ${x}, ${y}, ${handle}, ${flags})`);
}

export function initSystem(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.GETAKEYSTATE, GetAsyncKeyState);
    addOperation(OpCode.V_CLOSEALL, CloseAll);
    addOperation(OpCode.V_SYSTEM, System as Operation);

    addOperation(OpCode.VM_GETSCREENWIDTH, GetScreenWidth);
    addOperation(OpCode.VM_GETSCREENHEIGHT, GetScreenHeight);
    addOperation(OpCode.VM_GETWORKAREAX, GetWorkAreaX);
    addOperation(OpCode.VM_GETWORKAREAY, GetWorkAreaY);
    addOperation(OpCode.VM_GETWORKAREAWIDTH, GetWorkAreaWidth);
    addOperation(OpCode.VM_GETWORKAREAHEIGHT, GetWorkAreaHeight);
    addOperation(OpCode.GETCLASSDIR, GetClassDirectory);
    addOperation(OpCode.VM_FILEEXIST, FileExist);
    addOperation(OpCode.ADDSLASH, AddSlash);
    addOperation(OpCode.VM_GETDATE, GetDate);
    addOperation(OpCode.VM_GETTIME, GetTime);
    addOperation(OpCode.GETTICKCOUNT, GetTickCount);
    addOperation(OpCode.STDHYPERJUMP, StdHyperJump);
}
