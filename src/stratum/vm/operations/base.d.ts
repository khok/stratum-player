import { Operation } from "vm-types";

export function initBase(addOperation: (opcode: number, operation: Operation) => void): void;
