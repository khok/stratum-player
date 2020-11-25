export interface SchemaFunctions {
    readonly TLB: Uint16Array;

    getHObject(): number;
    getClassName(path: string): string;
    setVar(objectName: string, varName: string, value: number | string): void;

    sendMessage(objectName: string, className: string, ...varNames: string[]): void;

    setCapture(hspace: number, path: string, flags: number): void;
    releaseCapture(): void;

    registerObject(hspace: number, obj2d: number, path: string, message: number, flags: number): void;
    registerObject(wname: string, obj2d: number, path: string, message: number, flags: number): void;

    unregisterObject(hspace: number, path: string, code: number): void;
    unregisterObject(wname: string, path: string, code: number): void;
}
