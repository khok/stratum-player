import { VarData } from "data-types-base";
import { ParsedCode } from "vm-types";
import { parseVarValue } from "~/helpers/varValueFunctions";

export class ClassPrototype {
    readonly code?: ParsedCode;
    readonly variables?: {
        readonly lowCaseName: string;
        readonly type: VarData["type"];
        readonly defaultValue: string | number | undefined;
    }[];
    readonly varNameMap?: Map<string, number>;
    constructor(readonly name: string, { vars, code }: { vars?: VarData[]; code?: ParsedCode }) {
        this.code = code;
        if (vars) {
            this.variables = vars.map(({ name, defaultValue, type }) => ({
                lowCaseName: name.toLowerCase(),
                type,
                defaultValue: defaultValue ? parseVarValue(type, defaultValue) : undefined,
            }));
            this.varNameMap = new Map(this.variables.map((el, idx) => [el.lowCaseName, idx]));
        }
    }
    get variableCount(): number {
        return this.variables ? this.variables.length : 0;
    }

    getVarIdLowCase(varName: string): number | undefined {
        return this.varNameMap!.get(varName);
    }
}
