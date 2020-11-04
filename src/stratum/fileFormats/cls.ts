// class.cpp:6100
import { readVdrFile, VectorDrawing } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { FileReadingError, FileSignatureError } from "stratum/helpers/errors";
import { EntryCode } from "./entryCode";

export type BytecodeParser<TVmCode> = (bytes: Uint8Array) => TVmCode;
export type ClassVarType = "FLOAT" | "STRING" | "HANDLE" | "COLORREF";

export interface ClassVar {
    name: string;
    description: string;
    defaultValue: string;
    type: ClassVarType;
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

function readVars(stream: BinaryStream): ClassVar[] {
    const varCount = stream.uint16();

    const vars = new Array<ClassVar>(varCount);
    for (let i = 0; i < varCount; i++) {
        const name = stream.string();
        const description = stream.string();
        const defaultValue = stream.string();
        const type = stream.string();
        if (type !== "FLOAT" && type !== "HANDLE" && type !== "STRING" && type !== "COLORREF")
            throw new FileReadingError(stream, `Неизвестный тип переменной: ${type}.`);
        const flags = stream.int32();
        vars[i] = { name, description, defaultValue, type, flags };
    }
    //RETURN VALUE - (v.flags & 1024)
    return vars;
}

function readLinks(stream: BinaryStream): ClassLink[] {
    const linkCount = stream.uint16();

    const links = new Array<ClassLink>(linkCount);
    for (let i = 0; i < linkCount; i++) {
        const handle1 = stream.uint16();
        const handle2 = stream.uint16();
        const linkHandle = stream.uint16();
        const flags = stream.int32();
        const count = stream.uint16();
        const contactPadHandle = stream.uint16();

        const connectedVars = new Array<{ name1: string; name2: string }>(count);
        for (let j = 0; j < count; j++) {
            const name1 = stream.string();
            const name2 = stream.string();
            connectedVars[j] = { name1, name2 };
        }
        links[i] = { handle1, handle2, linkHandle, flags, connectedVars, contactPadHandle };
    }
    return links;
}

function readChildren(stream: BinaryStream): ClassChild[] {
    const childCount = stream.uint16();

    const children = new Array<ClassChild>(childCount);
    for (let i = 0; i < childCount; i++) {
        const classname = stream.string();
        const handle = stream.uint16();
        const name = stream.string();

        //class.cpp:5952
        if (!stream.meta.fileversion) throw Error("filversion?");
        const position = stream.meta.fileversion < 0x3002 ? stream.point2dInt() : stream.point2d();

        // const flag =  0 | stream.bytes(1)[0];
        const flags = stream.byte();
        children[i] = { classname, schemeInfo: { handle, name, position }, flags };
    }
    return children;
}

function readVdr(stream: BinaryStream, classname: string, type: string, readIt?: boolean) {
    const blockStart = stream.position;
    const blockSize = stream.int32();

    //проскакиваем, чтобы не тратить время на парсинг схемы
    if (!readIt) {
        stream.seek(blockStart + blockSize);
        return undefined;
    }

    const flags = stream.int32();

    if (flags & EntryCode.SF_EXTERNAL) {
        const filename = stream.string();
        throw new FileReadingError(stream, `Чтение внешних VDR не поддерживается;\nФайл VDR: ${filename}.`);
    }

    const vdrSize = stream.int32();
    const substream = stream.fork(vdrSize);
    stream.skip(vdrSize);

    let vdr: VectorDrawing;
    try {
        vdr = readVdrFile(substream);
        vdr.source = { origin: "class", name: classname };
    } catch (e) {
        console.error(`Ошибка чтения VDR ${classname} (${type})`, e);
        stream.seek(blockStart + blockSize);
        return undefined;
    }
    if (substream.position !== vdrSize) {
        const readed = substream.position;
        const notReaded = vdrSize - readed;

        const msg = `${type}: считано ${readed} байт, не считано ${notReaded}. v0x${
            substream.meta.fileversion && substream.meta.fileversion.toString(16)
        }.`;
        console.warn(stream.meta.filepathDos + ":\n" + msg);
    }
    return vdr;
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

export function readClsFileHeader(stream: BinaryStream): ClassInfoHeader {
    const sign = stream.uint16();
    if (sign !== 0x4253) throw new FileSignatureError(stream, sign, 0x4253);

    const version = stream.int32();
    stream.int32(); //magic1
    stream.int32(); //magic2
    const name = stream.string();

    return { name, version };
}

export function readClsFileBody<VmCode>(
    stream: BinaryStream,
    classname: string,
    blocks: {
        readScheme?: boolean;
        readImage?: boolean;
        parseBytecode?: BytecodeParser<VmCode>;
    }
): ClassInfoBody<VmCode> {
    const res: ClassInfoBody<VmCode> = {};

    let next = stream.uint16();
    if (next === EntryCode.CR_VARS1) {
        res.vars = readVars(stream);
        next = stream.uint16();
    }

    if (next === EntryCode.CR_LINKS) {
        res.links = readLinks(stream);
        next = stream.uint16();
    }

    if (next === EntryCode.CR_CHILDSnameXY || next === EntryCode.CR_CHILDSname || next === EntryCode.CR_CHILDS) {
        res.children = readChildren(stream);
        next = stream.uint16();
    }

    if (next === EntryCode.CR_ICON) {
        const iconSize = stream.int32();
        stream.skip(iconSize - 4);
        // res.icon = stream.bytes(iconSize - 4);
        next = stream.uint16();
    }

    if (next === EntryCode.CR_SCHEME) {
        res.scheme = readVdr(stream, classname, "Схема", blocks.readScheme);
        next = stream.uint16();
    }

    if (next === EntryCode.CR_IMAGE) {
        res.image = readVdr(stream, classname, "Изображение", blocks.readImage);
        next = stream.uint16();
    }

    if (next === EntryCode.CR_TEXT) {
        res.sourceCode = stream.string();
        next = stream.uint16();
    }

    if (next === EntryCode.CR_INFO) {
        res.description = stream.string();
        next = stream.uint16();
    }

    if (next === EntryCode.CR_VARSIZE) {
        res.varsize = stream.uint16();
        next = stream.uint16();
    }

    if (next === EntryCode.CR_FLAGS) {
        res.flags = stream.int32();
        next = stream.uint16();
    }

    if (next === EntryCode.CR_DEFICON) {
        res.iconIndex = stream.uint16();
        next = stream.uint16();
    }

    if (next === EntryCode.CR_ICONFILE) {
        res.iconFile = stream.string();
        next = stream.uint16();
    }

    if (next === EntryCode.CR_CODE) {
        const codesize = stream.int32() * 2;

        if (blocks.parseBytecode !== undefined) {
            try {
                res.code = blocks.parseBytecode(stream.bytes(codesize));
            } catch (e) {
                throw new FileReadingError(stream, e.message + " (байткод)");
            }
        } else {
            stream.skip(codesize);
        }
        next = stream.uint16();
    }

    if (next === EntryCode.CR_EQU) {
        console.warn(stream.meta.filepathDos + ":\nУравнения не поддерживаются.");
        return res;
    }

    if (next !== EntryCode.CR_CLASSTIME && stream.meta.fileversion === 0x3003)
        throw new FileReadingError(stream, "Ошибка в ходе чтения данных имиджа.");

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
