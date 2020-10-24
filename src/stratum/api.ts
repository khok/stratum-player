import { VirtualFileSystem } from "./common/virtualFileSystem";
import { BmpToolFactory } from "./graphics/scene";
import { Player } from "./player/player";
import { Project, ProjectOptions } from "./project/project";
import { parseBytecode } from "./vm/parseBytecode";
import { ParsedCode } from "./vm/types";

export function newFS(...args: Parameters<typeof VirtualFileSystem.new>): Promise<VirtualFileSystem> {
    return VirtualFileSystem.new(...args);
}

export type NewProjectOptions = Omit<ProjectOptions<ParsedCode>, "bytecodeParser">;
export function newProject(fs: VirtualFileSystem, opts: NewProjectOptions = {}) {
    return Project.open(fs, { bytecodeParser: parseBytecode, ...opts });
}

export function newPlayer(...args: ConstructorParameters<typeof Player>) {
    return new Player(...args);
}

export function setIconsPath(iconsPath: string) {
    BmpToolFactory.setIconsPath(iconsPath);
}

export * from "./graphics/windowSystems";
export { findMissingCommands, findMissingCommandsRecursive, formatMissingCommands } from "./vm/showMissingCommands";

export const version = "1.0.0";
