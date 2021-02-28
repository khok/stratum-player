import { VarType } from "stratum/common/varType";
import { Enviroment } from "stratum/env";
import { Schema } from "stratum/schema";
export { translate } from "./translator";

export interface ClassVars {
    count: number;
    nameUCToId: Map<string, number>;
    types: VarType[];
    defaultValues: (string | number | undefined)[];
}

export interface ClassModel {
    (schema: Schema, env: Enviroment): void;
}
