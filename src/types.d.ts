import { VectorDrawData } from "./graphics/types";
import { Bytecode } from "./vm/types";

//Закоменнчеые поля - не используются

export interface VarSet {
    // handle: number;
    // className: string;
    // classId: number;
    varData: { name: string; value: number | string }[];
    childs: { handle: number; set: VarSet }[];
}

export interface VarData {
    name: string;
    // description: string;
    defaultValue?: string | number;
    type: "FLOAT" | "STRING" | "HANDLE" | "COLORREF";
    flags: number;
}

export interface LinkData {
    handle1: number;
    handle2: number;
    // contactPadHandle: number;
    // linkHandle: number;
    vars: { name1: string; name2: string }[];
    flags: number;
}

export interface ChildData {
    className: string;
    onSchemeData: { handle: number; name: string; position: { x: number; y: number } };
    // flag =  0 | stream.readBytes(1)[0];
    flags: number;
}

export interface ClassHeaderData {
    name: string;
    version: number;
}

export interface ClassData {
    vars?: VarData[];
    links?: LinkData[];
    childs?: ChildData[];
    scheme?: VectorDrawData;
    image?: VectorDrawData;
    byteсode?: Bytecode;
    // __scheme?: any; //(выбросить)
    // __image?: any; //(выбросить)
    // sourceCode?: string;
    // description?: string;
    // varsize?: number;
    // flags?: number;
    // defaultIcon?: number;
    // iconName?: string;
    // classId?: number;
    // date?: {
    //     //не нужно
    //     sec: number;
    //     min: number;
    //     hour: number;
    //     day: number;
    //     month: number;
    //     year: number;
    // };
}
