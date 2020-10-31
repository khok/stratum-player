import { OpCode } from "./consts";
import { DOUBLE_OPERAND_FLAG_MASK, OPCODE_MASK, OTHER_OPERAND_FLAG_MASK, STRING_OPERAND_FLAG_MASK } from "./consts/operandFlagMasks";
import { ExecutionContext } from "./executionContext";
import { operations } from "./operations";
import { rapidBytecodePrint } from "./showMissingCommands/rapidBytecodePrint";
import realCommandNames from "./showMissingCommands/realCommandNames.json";
import { ParsedCode } from "./types";

export function executeCode(ctx: ExecutionContext, { code, numberOperands, stringOperands, otherOperands }: ParsedCode) {
    let opAndArg: number,
        opPoitner: number,
        iterCount: number = 0;

    ctx.nextOpPointer = 0; //TODO: использовать префиксный инкремент, нач. с -1
    ctx.lastOpPointer = code.length - 1;
    try {
        // пытался сделать это место максимально быстрым, так что получилось такое вот:
        while (((opAndArg = code[(opPoitner = ctx.nextOpPointer++)]) & OPCODE_MASK) !== 0) {
            if (++iterCount > 10000) {
                ctx.setError("Сработала защита от бесконечного цикла.");
                return;
            }

            const op = operations[opAndArg & OPCODE_MASK];
            if (opAndArg < DOUBLE_OPERAND_FLAG_MASK) {
                op(ctx);
            } else if (opAndArg < STRING_OPERAND_FLAG_MASK) {
                op(ctx, numberOperands[opPoitner]);
            } else if (opAndArg < OTHER_OPERAND_FLAG_MASK) {
                op(ctx, stringOperands[opPoitner]);
            } else {
                op(ctx, otherOperands[opPoitner]);
            }
        }
    } catch (e) {
        console.error(e);
        if (!operations[opAndArg! & OPCODE_MASK]) console.warn("Функция не существует.");
        const message = `Ошибка в функции: ${realCommandNames[opAndArg! & OPCODE_MASK]} (${OpCode[opAndArg! & OPCODE_MASK]}).\nИмидж: ${
            ctx.currentClass.protoName
        }. Индекс опкода: ${ctx.nextOpPointer - 1}.\n`;
        console.warn(message);
        rapidBytecodePrint((<any>ctx.currentClass).proto.code, (<any>ctx.currentClass).proto.vars.names);
        ctx.setError("Ошибка виртуальной машины");
    }
}
