import { VmCode } from "../deserializers/vmCode";

//Дизайн этих интерфейсов диктован командами ВМ

export interface IWindow {
    readonly spaceHandle: number;
    readonly topLeft: point;
    readonly size: point;
    setSize(x: number, y: number): boolean;
    setTopLeft(x: number, y: number): boolean;
}

export interface IGraphicObject {
    setPosition(x: number, y: number): boolean;
    readonly position: point;
    readonly size: point;
}

export interface ISchemeInstance {
    getObjectHandleFromPoint(x: number, y: number): number;
    findObjectHandle(groupHandle: number, objectName: string): number;
    getObject(objectHandle: number): IGraphicObject | undefined;
    setTopLeft(x: number, y: number): boolean;
    setScale(scale: number): boolean;
    readonly scale: number;
    readonly topLeft: point;
    readonly size: point;
}

type point = { x: number; y: number };

export interface IClassInstance {
    readonly protoName: string;
    getClassesByPath(path: string): IClassInstance | IClassInstance[] | undefined;
    getVarIdByName(varName: string): number | undefined;
    setNewVarValue(id: number, value: string | number): void;
    setOldVarValue(id: number, value: string | number): void;
    getNewVarValue(id: number): string | number;
    getOldVarValue(id: number): string | number;
    compute(vm: IVirtualMachine, computeChilds: boolean): void;
}

type SchemeResolver = (canvas: HTMLCanvasElement) => ISchemeInstance;

export interface IWindowSystem {
    readonly workAreaTopLeft: point;
    readonly workAreaSize: point;
    readonly screenSize: point;

    hasWindow(windowName: string): boolean;
    createSchemeWindow(windowName: string, flags: string, schemeResolver: SchemeResolver): number;
    getWindow(windowName: string): IWindow | undefined;
    getSpace(spaceHandle: number): ISchemeInstance | undefined;
    // openScheme(windowName: string, className: string, flags: string): number;
}

export interface IInputSystem {
    keyPressed(keyIndex: number): boolean;
}

export interface IProject {
    getClassesByProtoName(className: string): IClassInstance[];
    hasClass(className: string): boolean;
    createSchemeInstance(className: string): SchemeResolver | undefined;
}

export interface IVirtualMachine {
    readonly currentClass: IClassInstance;
    readonly windows: IWindowSystem;
    readonly input: IInputSystem;
    readonly project: IProject;

    readonly canComputeClass: boolean;

    computeClass(code: VmCode, classInstance: IClassInstance): void;
    stackPush(value: string | number): void;
    stackPop(): string | number;
    jumpTo(index: number): void;

    // stackPopAny(count: number): (string | number)[];
}
