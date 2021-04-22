import { EnviromentContextFunctions, InternalClassModel, ProjectContextFunctions, SchemaContextFunctions, SchemaMemory } from "./compilerTypes";

export const retCodeArg = "retCode";
export const modelArg = "model";
export const TLBArg = "TLB";
export const memArg = "mem";
export const schemaArg = "schema";

export const EXIT_CODE = 0;

export const prjVar: keyof SchemaContextFunctions = "prj";
export const envVar: keyof ProjectContextFunctions = "env";

export const of: keyof SchemaMemory = "oldFloats";
export const nf: keyof SchemaMemory = "newFloats";
export const oi: keyof SchemaMemory = "oldInts";
export const ni: keyof SchemaMemory = "newInts";
export const os: keyof SchemaMemory = "oldStrings";
export const ns: keyof SchemaMemory = "newStrings";

export const callFunc: keyof InternalClassModel = "call";
export const waitForFunc: keyof InternalClassModel = "waitFor";
export const getWaitResultFunc: keyof InternalClassModel = "getWaitResult";
export const saveContextFunc: keyof InternalClassModel = "saveContext";
export const loadContextFunc: keyof InternalClassModel = "loadContext";

export const getTimeFunc: keyof EnviromentContextFunctions = "getTime";
export const getDateFunc: keyof EnviromentContextFunctions = "getDate";
export const getActualSize2dFunc: keyof EnviromentContextFunctions = "getActualSize2d";
