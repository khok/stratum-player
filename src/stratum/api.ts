/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */
import { VirtualFileSystem } from "./common/virtualFileSystem";
import { SingleCanvasWindowSystem } from "./graphics/windowSystems";
import { Player } from "./player";
import { Project, ProjectOptions } from "./project/project";
import { parseBytecode } from "./vm/parseBytecode";
import { findMissingCommands, findMissingCommands2, formatMissingCommands } from "./vm/showMissingCommands";
import { ParsedCode } from "./vm/types";

// export function handlePossibleErrors(rootName: string, classes: Map<string, ClassPrototype<ParsedCode>>) {
//     const miss = findMissingCommands2(rootName, classes);
//     if (miss.errors.length > 0) console.warn("Ошибки:", miss.errors);
//     if (miss.missingOperations.length > 0) console.warn(formatMissingCommands(miss.missingOperations));
//     return miss.errors.length > 0 || miss.missingOperations.length > 0;
// }

export type OpenProjectOptions = Omit<ProjectOptions<ParsedCode>, "bytecodeParser">;

export async function openProject(fs: VirtualFileSystem, opts: OpenProjectOptions = {}) {
    return Project.open(fs, { bytecodeParser: parseBytecode, ...opts });
}

export { VirtualFileSystem, SingleCanvasWindowSystem, Player, findMissingCommands, findMissingCommands2, formatMissingCommands };
