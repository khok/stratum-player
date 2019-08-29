import { VmCommand } from ".";

export default function init(addCommand: (opcode: number, command: VmCommand) => void): void;
