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
    throw new Error("Не умею останавливаться");
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
    console.warn(`Вызов операции System(${command}, ${params})\n${systemCommands[command]}`);
    ctx.pushDouble(1);
}

// STRING GetClassDirectory(STRING ClassName)
function GetClassDirectory(ctx: VmStateContainer) {
    const className = ctx.popString();
    ctx.pushString(ctx.project.getClassDir(className));
}

// STRING AddSlash(STRING FileName)
function AddSlash(ctx: VmStateContainer) {
    const path = ctx.popString();
    ctx.pushString(path[path.length - 1] === "\\" ? path : path + "\\");
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

    const cl = ctx.currentClass;

    if (isDayNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![dayId]] = time.getDate();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![dayId]] = time.getDate();
    if (isMonthNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![monthId]] = time.getMonth();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![monthId]] = time.getMonth();
    if (isYearNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![yearId]] = time.getFullYear();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![yearId]] = time.getFullYear();
}

// GetTime(FLOAT hour, FLOAT min, FLOAT sec, FLOAT hund)
function GetTime(ctx: VmStateContainer) {
    const isWtfNew = ctx.popLong();
    const wtfId = ctx.popLong();
    const isSecNew = ctx.popLong();
    const secId = ctx.popLong();
    const isMinNew = ctx.popLong();
    const minId = ctx.popLong();
    const isHourNew = ctx.popLong();
    const hourId = ctx.popLong();

    const time = new Date();

    const cl = ctx.currentClass;

    if (isWtfNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![wtfId]] = time.getMilliseconds();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![wtfId]] = time.getMilliseconds();
    if (isSecNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![secId]] = time.getSeconds();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![secId]] = time.getSeconds();
    if (isMinNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![minId]] = time.getMinutes();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![minId]] = time.getMinutes();
    if (isHourNew) ctx.memoryState.newDoubleValues[cl.doubleVarMappingArray![hourId]] = time.getHours();
    else ctx.memoryState.oldDoubleValues[cl.doubleVarMappingArray![hourId]] = time.getHours();
}

// VM_GETSCREENWIDTH, name "GetScreenWidth" ret "FLOAT" out 772
function GetScreenWidth(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.windows.screenWidth);
}
// VM_GETSCREENHEIGHT, name "GetScreenHeight" ret "FLOAT" out 773
function GetScreenHeight(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.windows.screenHeight);
}

// VM_GETWORKAREAX, name "GetWorkAreaX" ret "FLOAT" out 774
function GetWorkAreaX(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.windows.areaOriginX);
}
// VM_GETWORKAREAY, name "GetWorkAreaY" ret "FLOAT" out 775
function GetWorkAreaY(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.windows.areaOriginY);
}
// VM_GETWORKAREAWIDTH, name "GetWorkAreaWidth" ret "FLOAT" out 776
function GetWorkAreaWidth(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.windows.areaWidth);
}
// VM_GETWORKAREAHEIGHT, name "GetWorkAreaHeight" ret "FLOAT" out 777
function GetWorkAreaHeight(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.windows.areaHeight);
}

const start = new Date().getMilliseconds();
// FLOAT GetTickCount()
function GetTickCount(ctx: VmStateContainer) {
    ctx.pushDouble(new Date().getTime() - start);
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
    addOperation(Opcode.ADDSLASH, AddSlash);
    addOperation(Opcode.VM_GETDATE, GetDate);
    addOperation(Opcode.VM_GETTIME, GetTime);
    addOperation(Opcode.GETTICKCOUNT, GetTickCount);
}
