import { executeCode } from "~/vm/executeCode";

export type NodeCode = Parameters<typeof executeCode>[1];
