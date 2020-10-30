import { executeCode } from "stratum/vm/executeCode";

export type NodeCode = Parameters<typeof executeCode>[1];
