// class.cpp:6100
import { BinaryReader, FileReadingError, FileSignatureError } from "stratum/helpers/binaryReader";
import { EntryCode } from "./entryCode";
import { readVdrFile, VectorDrawing } from "./vdr";

export type BytecodeParser<TVmCode> = (bytes: Uint8Array) => TVmCode;

export interface ClassVar {
    name: string;
    description: string;
    defaultValue: string;
    type: "STRING" | "FLOAT" | "INTEGER" | "HANDLE" | "COLORREF";
    flags: number;
}

export interface ClassLink {
    handle1: number;
    handle2: number;
    contactPadHandle: number;
    linkHandle: number;
    connectedVars: { name1: string; name2: string }[];
    flags: number;
}

export interface ClassChild {
    classname: string;
    schemeInfo: {
        handle: number;
        name: string;
        position: { x: number; y: number };
    };
    // flag =  0 | stream.bytes(1)[0];
    flags: number;
}

export interface ClassInfoHeader {
    name: string;
    version: number;
}

export interface ClassInfoBody<VmCode> {
    vars?: ClassVar[];
    links?: ClassLink[];
    children?: ClassChild[];
    scheme?: VectorDrawing;
    image?: VectorDrawing;
    code?: VmCode;
    iconFile?: string;
    iconIndex?: number;
    sourceCode?: string;
    description?: string;
    varsize?: number;
    flags?: number;
    classId?: number;
    date?: Date;
}

function readVars(reader: BinaryReader): ClassVar[] {
    const varCount = reader.uint16();

    const vars = new Array<ClassVar>(varCount);
    for (let i = 0; i < varCount; i++) {
        const name = reader.string();
        const description = reader.string();
        const defaultValue = reader.string();
        const readedType = reader.string().toUpperCase();
        if (readedType !== "STRING" && readedType !== "FLOAT" && readedType !== "INTEGER" && readedType !== "HANDLE" && readedType !== "COLORREF") {
            throw new FileReadingError(reader, `неизвестный тип переменной: ${readedType}.`);
        }
        const flags = reader.int32();
        vars[i] = { name, description, defaultValue, type: readedType, flags };
    }
    //RETURN VALUE - (v.flags & 1024)
    return vars;
}

function readLinks(reader: BinaryReader): ClassLink[] {
    const linkCount = reader.uint16();

    const links = new Array<ClassLink>(linkCount);
    for (let i = 0; i < linkCount; i++) {
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

function readChildren(reader: BinaryReader, version: number): ClassChild[] {
    const childCount = reader.uint16();

    const children = new Array<ClassChild>(childCount);
    for (let i = 0; i < childCount; i++) {
        const classname = reader.string();
        const handle = reader.uint16();
        const name = reader.string();

        //class.cpp:5952
        const position = version < 0x3002 ? reader.point2dInt() : reader.point2d();

        // const flag =  0 | stream.bytes(1)[0];
        const flags = reader.byte();
        children[i] = { classname, schemeInfo: { handle, name, position }, flags };
    }
    return children;
}

function readVdr(reader: BinaryReader, classname: string, type: "Схема" | "Изображение") {
    const fmt = `${type} ${classname} (${reader.name || "?"})`;
    const flags = reader.int32();
    if (flags & EntryCode.SF_EXTERNAL) {
        const filename = reader.string();
        console.warn(`${fmt}: ошибка чтения. Причина: чтение внешних VDR (${filename}) не реализовано.`);
        return undefined;
    }

    const data = reader.bytes(reader.int32());
    try {
        return readVdrFile(new BinaryReader(data, fmt), { origin: "class", name: classname });
    } catch (e) {
        console.warn(`${fmt}): ошибка чтения.\nПричина: ${e.message}`);
        return undefined;
    }
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

export function readClsFileHeader(reader: BinaryReader): ClassInfoHeader {
    const sign = reader.uint16();
    if (sign !== 0x4253) throw new FileSignatureError(reader, sign, 0x4253);

    const version = reader.int32();
    reader.int32(); //magic1
    reader.int32(); //magic2
    const name = reader.string();

    return { name, version };
}

export function readClsFileBody<VmCode>(
    reader: BinaryReader,
    classname: string,
    version: number,
    blocks: {
        readScheme?: boolean;
        readImage?: boolean;
        parseBytecode?: BytecodeParser<VmCode>;
    }
): ClassInfoBody<VmCode> {
    const res: ClassInfoBody<VmCode> = {};

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
        res.children = readChildren(reader, version);
        next = reader.uint16();
    }

    if (next === EntryCode.CR_ICON) {
        const iconSize = reader.int32();
        reader.skip(iconSize - 4);
        // res.icon = stream.bytes(iconSize - 4);
        next = reader.uint16();
    }

    if (next === EntryCode.CR_SCHEME) {
        const blockSize = reader.int32();
        if (!blocks.readScheme) reader.skip(blockSize - 4);
        else res.scheme = readVdr(reader, classname, "Схема");
        next = reader.uint16();
    }

    if (next === EntryCode.CR_IMAGE) {
        const blockSize = reader.int32();
        if (!blocks.readImage) reader.skip(blockSize - 4);
        else res.image = readVdr(reader, classname, "Изображение");
        next = reader.uint16();
    }

    if (next === EntryCode.CR_TEXT) {
        res.sourceCode = reader.string();
        next = reader.uint16();
    }

    if (next === EntryCode.CR_INFO) {
        res.description = reader.string();
        next = reader.uint16();
    }

    if (next === EntryCode.CR_VARSIZE) {
        res.varsize = reader.uint16();
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
        const codesize = reader.int32() * 2;

        if (blocks.parseBytecode !== undefined) {
            const raw = reader.bytes(codesize);
            try {
                res.code = blocks.parseBytecode(raw);
            } catch (e) {
                console.warn(`Байткод ${classname} (${reader.name || "?"}): ошибка чтения.\nПричина: ${e.message}`);
            }
        } else {
            reader.skip(codesize);
        }
        next = reader.uint16();
    }

    if (next === EntryCode.CR_EQU) {
        console.warn(`${classname} (${reader.name || "?"}):\nУравнения не поддерживаются.`);
        return res;
    }

    if (next !== EntryCode.CR_CLASSTIME && version === 0x3003) {
        console.warn(`${classname} (${reader.name || "?"}: тут что-то не так...`);
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
