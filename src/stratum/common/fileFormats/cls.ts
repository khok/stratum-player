// class.cpp:6100
import { BinaryStream } from "/helpers/binaryStream";
import { FileReadingError, FileSignatureError } from "../errors";
import { VectorDrawing } from "./vdr/types/vectorDrawing";
import { EntryCode } from "./entryCode";
import { readVdrFile } from "./vdr";

export type BytecodeParser<TVmCode> = (stream: BinaryStream, size: number) => TVmCode;
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
    // flag =  0 | stream.readBytes(1)[0];
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
    const varCount = stream.readWord();

    const vars = new Array<ClassVar>(varCount);
    for (let i = 0; i < varCount; i++) {
        const name = stream.readString();
        const description = stream.readString();
        const defaultValue = stream.readString();
        const type = stream.readString();
        if (type !== "FLOAT" && type !== "HANDLE" && type !== "STRING" && type !== "COLORREF")
            throw new FileReadingError(stream.filename, `Неизвестный тип переменной: ${type}.`);
        const flags = stream.readLong();
        vars[i] = { name, description, defaultValue, type, flags };
    }
    //RETURN VALUE - (v.flags & 1024)
    return vars;
}

function readLinks(stream: BinaryStream): ClassLink[] {
    const linkCount = stream.readWord();

    const links = new Array<ClassLink>(linkCount);
    for (let i = 0; i < linkCount; i++) {
        const handle1 = stream.readWord();
        const handle2 = stream.readWord();
        const linkHandle = stream.readWord();
        const flags = stream.readLong();
        const count = stream.readWord();
        const contactPadHandle = stream.readWord();

        const connectedVars = new Array<{ name1: string; name2: string }>(count);
        for (let j = 0; j < count; j++) {
            const name1 = stream.readString();
            const name2 = stream.readString();
            connectedVars[j] = { name1, name2 };
        }
        links[i] = { handle1, handle2, linkHandle, flags, connectedVars, contactPadHandle };
    }
    return links;
}

function readChildren(stream: BinaryStream): ClassChild[] {
    const childCount = stream.readWord();

    const children = new Array<ClassChild>(childCount);
    for (let i = 0; i < childCount; i++) {
        const classname = stream.readString();
        const handle = stream.readWord();
        const name = stream.readString();

        //class.cpp:5952
        const position = stream.fileversion < 0x3002 ? stream.readIntegerPoint2D() : stream.readPoint2D();

        // const flag =  0 | stream.readBytes(1)[0];
        const flags = stream.readByte();
        children[i] = { classname, schemeInfo: { handle, name, position }, flags };
    }
    return children;
}

function readVdr(stream: BinaryStream, classname: string, type: string, readIt?: boolean) {
    const blockStart = stream.position;
    const blockSize = stream.readLong();

    //проскакиваем, чтобы не тратить время на парсинг схемы
    if (!readIt) {
        stream.seek(blockStart + blockSize);
        return undefined;
    }

    const flags = stream.readLong();

    if (flags & EntryCode.SF_EXTERNAL) {
        const filename = stream.readString();
        throw new FileReadingError(stream.filename, `Чтение внешних VDR не поддерживается;\nФайл VDR: ${filename}.`);
    }

    const vdrSize = stream.readLong();
    const substream = stream.substream(vdrSize);
    stream.seek(stream.position + vdrSize);

    const vdr = readVdrFile(substream, { origin: "class", name: classname });
    if (substream.position !== vdrSize) {
        const readed = substream.position;
        const notReaded = vdrSize - readed;

        const msg = `${type}: считано ${readed} байт, не считано ${notReaded}. v0x${substream.fileversion.toString(16)}.`;
        console.warn(stream.filename + ":\n" + msg);
    }
    return vdr;
}

// const EC_VAR = 16384;
// const EC_CONST = 0;
// function readEquations(stream: BinaryStream) {
//     const code = stream.readWord();

//     if (code === EC_VAR) {
//         const index = stream.readWord();
//         const eqflag = stream.readWord();
//     }

//     if (code === EC_CONST) {
//         const value = stream.readBytes(8);
//     }

//     let byte;
//     while ((byte = stream.readBytes(1)[0])) readEquations(stream);
// }

export function readClsFileHeader(stream: BinaryStream): ClassInfoHeader {
    const sign = stream.readWord();
    if (sign !== 0x4253) throw new FileSignatureError(stream.filename, sign, 0x4253);

    const version = stream.readLong();
    stream.readLong(); //magic1
    stream.readLong(); //magic2
    const name = stream.readString();

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

    let next = stream.readWord();
    if (next === EntryCode.CR_VARS1) {
        res.vars = readVars(stream);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_LINKS) {
        res.links = readLinks(stream);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_CHILDSnameXY || next === EntryCode.CR_CHILDSname || next === EntryCode.CR_CHILDS) {
        res.children = readChildren(stream);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_ICON) {
        const iconSize = stream.readLong();
        stream.seek(stream.position + iconSize - 4);
        // res.icon = stream.readBytes(iconSize - 4);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_SCHEME) {
        res.scheme = readVdr(stream, classname, "Схема", blocks.readScheme);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_IMAGE) {
        res.image = readVdr(stream, classname, "Изображение", blocks.readImage);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_TEXT) {
        res.sourceCode = stream.readString();
        next = stream.readWord();
    }

    if (next === EntryCode.CR_INFO) {
        res.description = stream.readString();
        next = stream.readWord();
    }

    if (next === EntryCode.CR_VARSIZE) {
        res.varsize = stream.readWord();
        next = stream.readWord();
    }

    if (next === EntryCode.CR_FLAGS) {
        res.flags = stream.readLong();
        next = stream.readWord();
    }

    if (next === EntryCode.CR_DEFICON) {
        res.iconIndex = stream.readWord();
        next = stream.readWord();
    }

    if (next === EntryCode.CR_ICONFILE) {
        res.iconFile = stream.readString();
        next = stream.readWord();
    }

    if (next === EntryCode.CR_CODE) {
        const codesize = stream.readLong() * 2;

        if (blocks.parseBytecode !== undefined) {
            try {
                res.code = blocks.parseBytecode(stream.substream(codesize), codesize);
            } catch (e) {
                throw new FileReadingError(stream.filename + " (байткод)", e.message);
            }
        }

        stream.seek(stream.position + codesize);
        next = stream.readWord();
    }

    if (next === EntryCode.CR_EQU) {
        console.warn(stream.filename + ":\nУравнения не поддерживаются.");
        return res;
    }

    if (next !== EntryCode.CR_CLASSTIME && stream.fileversion === 0x3003)
        throw new FileReadingError(stream.filename, "Ошибка в ходе чтения данных имиджа.");

    // let classId = stream.readLong();
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
