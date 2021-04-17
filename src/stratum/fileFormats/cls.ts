// class.cpp:6100
import { BinaryReader, FileReadingError, FileSignatureError } from "stratum/helpers/binaryReader";
import { Point2D } from "stratum/helpers/types";
import { EntryCode } from "./entryCode";

export interface ClassVarInfo {
    name: string;
    description: string;
    defaultValue: string;
    type: "STRING" | "FLOAT" | "INTEGER" | "HANDLE" | "COLORREF";
    flags: number;
}

export interface ConnectionInfo {
    name1: string;
    name2: string;
}

export interface ClassLinkInfo {
    handle1: number;
    handle2: number;
    contactPadHandle: number;
    linkHandle: number;
    connectedVars: ConnectionInfo[];
    flags: number;
}

export interface ClassChildInfo {
    classname: string;
    handle: number;
    schemeName: string;
    position: Point2D;
    flags: number;
}

export interface ClassInfo {
    name: string;
    version: number;
    vars?: ClassVarInfo[];
    links?: ClassLinkInfo[];
    children?: ClassChildInfo[];
    scheme?: Uint8Array | string;
    image?: Uint8Array | string;
    // code?: Uint8Array;
    iconFile?: string;
    iconIndex?: number;
    sourceCode?: string;
    // description?: string;
    // varsize?: number;
    flags?: number;
    // classId?: number;
    // date?: Date;
}

function readVars(reader: BinaryReader): ClassVarInfo[] {
    const varCount = reader.uint16();

    const vars = new Array<ClassVarInfo>(varCount);
    for (let i = 0; i < varCount; ++i) {
        const name = reader.string();
        const description = reader.string();
        const defaultValue = reader.string();
        const type = reader.string().toUpperCase();
        if (type !== "STRING" && type !== "FLOAT" && type !== "INTEGER" && type !== "HANDLE" && type !== "COLORREF") {
            throw new FileReadingError(reader, `неизвестный тип переменной: ${type}.`);
        }
        const flags = reader.int32();
        vars[i] = { name, description, defaultValue, type, flags };
    }
    //RETURN VALUE - (v.flags & 1024)
    return vars;
}

function readLinks(reader: BinaryReader): ClassLinkInfo[] {
    const linkCount = reader.uint16();

    const links = new Array<ClassLinkInfo>(linkCount);
    for (let i = 0; i < linkCount; ++i) {
        const handle1 = reader.uint16();
        const handle2 = reader.uint16();
        const linkHandle = reader.uint16();
        const flags = reader.int32();
        const count = reader.uint16();
        const contactPadHandle = reader.uint16();

        const connectedVars = new Array<{ name1: string; name2: string }>(count);
        for (let j = 0; j < count; j++) {
            const name1 = reader.string();
            const name2 = reader.string();
            connectedVars[j] = { name1, name2 };
        }
        links[i] = { handle1, handle2, linkHandle, flags, connectedVars, contactPadHandle };
    }
    return links;
}

function readChildren(reader: BinaryReader, version: number): ClassChildInfo[] {
    const childCount = reader.uint16();

    const children = new Array<ClassChildInfo>(childCount);
    for (let i = 0; i < childCount; ++i) {
        const classname = reader.string();
        const handle = reader.uint16();
        const schemeName = reader.string();

        //class.cpp:5952
        const position = reader.point2d(version < 0x3002);

        // const flag =  0 | stream.bytes(1)[0];
        const flags = reader.byte();
        children[i] = { classname, handle, schemeName, position, flags };
    }
    return children;
}

function readVdr(reader: BinaryReader): Uint8Array | string {
    const flags = reader.int32();
    if (flags & EntryCode.SF_EXTERNAL) {
        return reader.string();
    }
    return reader.bytes(reader.int32());
}

// const EC_VAR = 16384;
// const EC_CONST = 0;
// function readEquations(stream: BinaryStream) {
//     const code = stream.uint16();

//     if (code === EC_VAR) {
//         const index = stream.uint16();
//         const eqflag = stream.uint16();
//     }

//     if (code === EC_CONST) {
//         const value = stream.bytes(8);
//     }

//     let byte;
//     while ((byte = stream.bytes(1)[0])) readEquations(stream);
// }

export function readClsHeader(reader: BinaryReader): ClassInfo {
    const sign = reader.uint16();
    if (sign !== 0x4253) throw new FileSignatureError(reader, sign, 0x4253);

    const version = reader.int32();
    reader.skip(8); //magic1: in32, magic2 : int32
    const name = reader.string();

    return { name, version };
}

export function readClsFile(reader: BinaryReader): ClassInfo {
    const res: ClassInfo = readClsHeader(reader);
    let next = reader.uint16();

    if (next === EntryCode.CR_VARS1) {
        res.vars = readVars(reader);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_LINKS) {
        res.links = readLinks(reader);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_CHILDSnameXY || next === EntryCode.CR_CHILDSname || next === EntryCode.CR_CHILDS) {
        res.children = readChildren(reader, res.version);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_ICON) {
        const iconSize = reader.int32();
        reader.skip(iconSize - 4);
        // res.icon = stream.bytes(iconSize - 4);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_SCHEME) {
        reader.skip(4); //blockSize int32
        res.scheme = readVdr(reader);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_IMAGE) {
        reader.skip(4); //blockSize int32
        res.image = readVdr(reader);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_TEXT) {
        res.sourceCode = reader.string();
        next = reader.uint16();
    }
    if (next === EntryCode.CR_INFO) {
        reader.skip(reader.uint16());
        // res.description = reader.string();
        next = reader.uint16();
    }
    if (next === EntryCode.CR_VARSIZE) {
        reader.skip(2);
        // res.varsize = reader.uint16();
        next = reader.uint16();
    }
    if (next === EntryCode.CR_FLAGS) {
        res.flags = reader.int32();
        next = reader.uint16();
    }
    if (next === EntryCode.CR_DEFICON) {
        res.iconIndex = reader.uint16();
        next = reader.uint16();
    }
    if (next === EntryCode.CR_ICONFILE) {
        res.iconFile = reader.string();
        next = reader.uint16();
    }
    if (next === EntryCode.CR_CODE) {
        reader.skip(reader.int32() * 2);
        // const codesize = reader.int32() * 2;
        // res.code = reader.bytes(codesize);
        next = reader.uint16();
    }
    if (next === EntryCode.CR_EQU) {
        // if (false) console.warn(`${res.name} (${reader.name || "?"}):\nУравнения не поддерживаются.`);
        return res;
    }
    if (next !== EntryCode.CR_CLASSTIME && res.version === 0x3003) {
        console.warn(`${res.name} (${reader.name || "?"}: тут что-то не так...`);
    }
    // let classId = stream.int32();
    // res.classId = classId;

    // const BITS4 = 0b0001111;
    // const BITS5 = 0b0011111;
    // const BITS6 = 0b0111111;
    // const BITS7 = 0b1111111;

    // const sec = classId & BITS5;
    // const min = (classId >>= 5) & BITS6;
    // const hour = (classId >>= 6) & BITS5;
    // const day = (classId >>= 5) & BITS5;
    // const month = (classId >>= 5) & BITS4;
    // const year = ((classId >>= 4) & BITS7) + 1996;

    // res.date = new Date(year, month, day, hour, min, sec);
    return res;
}
