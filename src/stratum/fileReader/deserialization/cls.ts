/* Основано на class.cpp:6100
 */
import { ChildData, ClassData, LinkData, VarData } from "cls-types";
import { BinaryStream } from "~/helpers/binaryStream";
import { FileSignatureError, StratumError } from "~/helpers/errors";
import { readVectorDrawData } from ".";
import { parseBytecode } from "./parseBytecode";
import { RecordType } from "./recordType";

function readVars(stream: BinaryStream): VarData[] {
    const varCount = stream.readWord();

    const vars = new Array<VarData>(varCount);
    for (let i = 0; i < varCount; i++) {
        const name = stream.readString();
        const description = stream.readString();
        const defaultValue = stream.readString();
        const type = stream.readString();
        if (type !== "FLOAT" && type !== "HANDLE" && type !== "STRING" && type !== "COLORREF")
            throw new StratumError(`Неизвестный тип переменной: ${type}`);
        const flags = stream.readLong();
        vars[i] = { name, type, defaultValue, description, flags };
    }
    //RETURN VALUE - (v.flags & 1024)
    return vars;
}

function readLinks(stream: BinaryStream): LinkData[] {
    const linkCount = stream.readWord();

    const links = new Array<LinkData>(linkCount);
    for (let i = 0; i < linkCount; i++) {
        const handle1 = stream.readWord();
        const handle2 = stream.readWord();
        const linkHandle = stream.readWord();
        const flags = stream.readLong();
        const count = stream.readWord();
        const contactPadHandle = stream.readWord(); //Только если подключается к контактной площадке; иначе 0

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

function readChilds(stream: BinaryStream, version: number): ChildData[] {
    const childCount = stream.readWord();

    const childs = new Array<ChildData>(childCount);
    for (let i = 0; i < childCount; i++) {
        const classname = stream.readString();
        const handle = stream.readWord();
        const nameOnScheme = stream.readString();

        //class.cpp:5952
        const position = version < 0x3002 ? stream.readIntegerPoint2D() : stream.readPoint2D();

        // const flag =  0 | stream.readBytes(1)[0];
        const flags = stream.readBytes(1)[0];
        childs[i] = { classname, handle, nameOnScheme, position, flags };
    }
    return childs;
}

function readVdr(stream: BinaryStream, silent = true) {
    const flags = stream.readLong();

    if (flags & RecordType.SF_EXTERNAL) {
        const filename = stream.readString();
        throw new StratumError("Чтение внешних VDR не поддерживается;\nVDR file: " + filename);
    }

    const vdrSize = stream.readLong();
    const start = stream.position;
    const end = start + vdrSize;

    const vdr = readVectorDrawData(stream);

    if (stream.position !== end) {
        const readed = stream.position - start;
        if (!silent)
            console.warn(
                `Граф. пространство: считано ${readed} вместо ${vdrSize}. Не считано ${vdrSize - readed}. ` +
                    `v0x${(<any>stream).fileversion.toString(16)}`
            );
        stream.seek(end);
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

export function readClassHeaderData(stream: BinaryStream): { name: string; version: number } {
    const sign = stream.readWord();
    if (sign !== 0x4253) throw new FileSignatureError(sign, 0x4253);

    const version = stream.readLong();
    stream.readLong(); //magic1
    stream.readLong(); //magic2
    const name = stream.readString();
    return { name, version };
}

export function readClassBodyData(
    stream: BinaryStream,
    res: ClassData,
    blocks: {
        readScheme?: boolean;
        readImage?: boolean;
        parseBytecode?: boolean;
    }
) {
    const errs: string[] = [];

    let next = stream.readWord();
    if (next === RecordType.CR_VARS1) {
        res.vars = readVars(stream);
        next = stream.readWord();
    }

    if (next === RecordType.CR_LINKS) {
        res.links = readLinks(stream);
        next = stream.readWord();
    }

    if (next === RecordType.CR_CHILDSnameXY || next === RecordType.CR_CHILDSname || next === RecordType.CR_CHILDS) {
        res.childInfo = readChilds(stream, res.version);
        next = stream.readWord();
    }

    if (next === RecordType.CR_ICON) {
        const iconSize = stream.readLong();
        stream.seek(stream.position + iconSize - 4);
        // res.icon = stream.readBytes(iconSize - 4);
        next = stream.readWord();
    }

    function readImage(readIt?: boolean) {
        const _start = stream.position;
        const blockSize = stream.readLong();
        const _end = _start + blockSize;

        //проскакиваем, чтобы не тратить время на парсинг схемы
        if (!readIt) {
            stream.seek(_end);
            return;
        }
        return readVdr(stream, false);
    }

    if (next === RecordType.CR_SCHEME) {
        res.scheme = readImage(blocks.readScheme);
        next = stream.readWord();
    }

    if (next === RecordType.CR_IMAGE) {
        res.image = readImage(blocks.readImage);
        next = stream.readWord();
    }

    if (next === RecordType.CR_TEXT) {
        res.sourceCode = stream.readString();
        next = stream.readWord();
    }

    if (next === RecordType.CR_INFO) {
        res.description = stream.readString();
        next = stream.readWord();
    }

    if (next === RecordType.CR_VARSIZE) {
        res.varsize = stream.readWord();
        next = stream.readWord();
    }

    if (next === RecordType.CR_FLAGS) {
        res.flags = stream.readLong();
        next = stream.readWord();
    }

    if (next === RecordType.CR_DEFICON) {
        res.iconIndex = stream.readWord();
        next = stream.readWord();
    }

    if (next === RecordType.CR_ICONFILE) {
        res.iconFile = stream.readString();
        next = stream.readWord();
    }

    if (next === RecordType.CR_CODE) {
        const codesize = stream.readLong() * 2;
        const substream = stream.substream(codesize);
        const original = stream.readBytes(codesize);
        res.bytecode = {
            original,
            parsed: blocks.parseBytecode ? parseBytecode(substream, codesize) : undefined,
        };
        next = stream.readWord();
    }

    if (next === RecordType.CR_EQU) {
        console.warn("Уравнения не поддерживаются.");
        return res;
    }

    if (next !== RecordType.CR_CLASSTIME && res.version === 0x3003)
        throw new StratumError("Ошибка в ходе чтения данных имиджа");

    let classId = stream.readLong();
    res.classId = classId;

    const BITS4 = 0b0001111;
    const BITS5 = 0b0011111;
    const BITS6 = 0b0111111;
    const BITS7 = 0b1111111;

    const sec = classId & BITS5;
    const min = (classId >>= 5) & BITS6;
    const hour = (classId >>= 6) & BITS5;
    const day = (classId >>= 5) & BITS5;
    const month = (classId >>= 5) & BITS4;
    const year = ((classId >>= 4) & BITS7) + 1996;

    res.date = { sec, min, hour, day, month, year };

    if (errs.length !== 0) throw new StratumError(errs.join("\n;"));
    return res;
}
