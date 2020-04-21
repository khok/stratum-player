import { VarData } from "cls-types";
import { ParsedCode } from "vm-types";
import { parseVarValue } from "~/helpers/varValueFunctions";

export class ClassPrototype {
    readonly code?: ParsedCode;
    readonly variables?: {
        readonly lowCaseName: string;
        readonly type: VarData["type"];
        readonly defaultValue: string | number | undefined;
    }[];
    constructor(readonly name: string, { vars, code }: { vars?: VarData[]; code?: ParsedCode }) {
        this.code = code;
        //prettier-ignore
        this.variables = vars && vars.map(({ name, defaultValue, type }) => ({
            lowCaseName: name.toLowerCase(),
            type,
            defaultValue: defaultValue ? parseVarValue(type, defaultValue) : undefined,
        }));
    }
}
