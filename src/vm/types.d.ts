// type OneOf<T> = (T extends any ? (k: T) => void : never) extends ((k: infer I) => void) ? I : never;
export interface FunctionOperand {
    funcName: string;
    argCount: number;
    argTypes: number[];
    returnType: number;
}

export type Operand = number | string | FunctionOperand;
export type OperandType =
    | "double"
    | "uint"
    | "string"
    | "codepoint"
    | "varId"
    | "word"
    | "functionData"
    | "dllFunctionData";

export type Operation = (ctx: VmContext, operand?: Operand) => void;

export interface Bytecode {
    [index: number]: { operation: Operation; operand?: Operand };
    // code: readonly number[];
    // operands: readonly OneOfOperand[];
    // missingCommands: readonly string[];
}

export const enum VmBool {
    False = 0,
    True = 1
}

export interface GraphicObjectFunctions {
    readonly name: string;
    readonly parentHandle: number;

    readonly positionX: number;
    readonly positionY: number;
    setPosition(x: number, y: number): VmBool;

    rotate(centerX: number, centerY: number, angleRad: number): VmBool;

    readonly width: number;
    readonly height: number;
    setSize(width: number, height: number): VmBool;

    readonly zOrder: number;
    setZOrder(zOrder: number): VmBool;

    setVisibility(visible: VmBool): VmBool;
}

export interface GraphicSpaceFunctions {
    readonly originX: number;
    readonly originY: number;
    setOrigin(x: number, y: number): VmBool;

    // readonly scale: number;
    // setScale(scale: number): VmBool;

    getObject(objectHandle: number): GraphicObjectFunctions | undefined;

    findObjectHandleByName(groupHandle: number, objectName: string): number;
    getObjectHandleFromPoint(x: number, y: number): number;
}

export type SchemeResolver = (canvas: HTMLCanvasElement) => GraphicSpaceFunctions;

export interface WindowFunctions {
    readonly spaceHandle: number;

    readonly originX: number;
    readonly originY: number;
    setOrigin(x: number, y: number): VmBool;

    readonly width: number;
    readonly height: number;
    setSize(width: number, height: number): VmBool;
}

export interface WindowingFunctions {
    readonly areaOriginX: number;
    readonly areaOriginY: number;
    readonly areaWidth: number;
    readonly areaHeight: number;

    readonly screenHeight: number;
    readonly screenWidth: number;

    createSchemeWindow(windowName: string, flags: string, schemeResolver: SchemeResolver): number;
    hasWindow(windowName: string): VmBool;
    getWindow(windowName: string): WindowFunctions | undefined;
    getSpace(spaceHandle: number): GraphicSpaceFunctions | undefined;
}

export interface ProjectFunctions {
    createSchemeInstance(className: string): SchemeResolver | undefined;
    hasClass(className: string): VmBool;
    getClassesByProtoName(className: string): ClassFunctions[];
    stopComputing(): void;
}

export interface ClassFunctions {
    readonly protoName: string;
    getVarId(varName: string): number | undefined;

    setNewVarValue(id: number, value: string | number): void;
    setOldVarValue(id: number, value: string | number): void;
    getNewVarValue(id: number): string | number;
    getOldVarValue(id: number): string | number;

    getClassesByPath(path: string): ClassFunctions | ClassFunctions[] | undefined;
    compute(ctx: VmContext, respectDisableVar: boolean): void;
}

export interface InputFunctions {
    keyPressed(keyIndex: number): VmBool;
}

export interface VmContext {
    stackPush(value: string | number): void;
    stackPop(): string | number;
    jumpTo(index: number): void;

    readonly canComputeClass: boolean;

    readonly currentClass: ClassFunctions;
    readonly windows: WindowingFunctions;
    readonly input: InputFunctions;
    readonly project: ProjectFunctions;

    compute(code: Bytecode, theClass: ClassFunctions): void;
    break(): void;
    error(message?: string): void;
}
