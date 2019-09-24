/* Основано на class.cpp:6100
 */
import { FileSignatureError, NotImplementedError, StratumError } from "../../errors";
import { parseVarValue } from "../../helpers";
import { ChildData, ClassData, ClassHeaderData, LinkData, VarData } from "../../types";
import { BinaryStream } from "../binaryStream";
import { parseBytecode } from "./bytecode";
import { RecordType } from "./recordType";
import { readVectorDrawData } from "./vdrFile/reader";

function readVars(stream: BinaryStream): VarData[] {
    const varCount = stream.readWord();

    const vars = new Array<VarData>(varCount);
    for (let i = 0; i < varCount; i++) {
        const name = stream.readString();
        const description = stream.readString();
        const value = stream.readString();
        const type = <VarData["type"]>stream.readString();
        const flags = stream.readLong();
        vars[i] = { name, type, defaultValue: value ? parseVarValue(type, value) : undefined, flags };
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

        const vars = new Array<{ name1: string; name2: string }>(count);
        for (let j = 0; j < count; j++) {
            const name1 = stream.readString();
            const name2 = stream.readString();
            vars[j] = { name1, name2 };
        }
        links[i] = { handle1, handle2, flags, vars };
    }
    return links;
}

function readChilds(stream: BinaryStream, version: number): ChildData[] {
    const childCount = stream.readWord();

    const childs = new Array<ChildData>(childCount);
    for (let i = 0; i < childCount; i++) {
        const className = stream.readString();
        const localHandle = stream.readWord();
        const name = stream.readString();

        //class.cpp:5952
        const position = version < 0x3002 ? stream.readIntegerPoint2D() : stream.readPoint2D();

        // const flag =  0 | stream.readBytes(1)[0];
        const flags = stream.readBytes(1)[0];
        childs[i] = { className, onSchemeData: { handle: localHandle, name, position }, flags };
    }
    return childs;
}

function readVdr(stream: BinaryStream) {
    const flags = stream.readLong();

    if (flags & RecordType.SF_EXTERNAL) {
        const filename = stream.readString();
        throw new NotImplementedError("Чтение внешних VDR не поддерживается;\nVDR file: " + filename);
    }

    const vdrSize = stream.readLong();
    const start = stream.position;
    const end = start + vdrSize;

    const vdr = readVectorDrawData(stream);

    if (stream.position !== end) {
        const readed = stream.position - start;
        console.warn(
            `Граф. пространство: считано ${readed} вместо ${vdrSize}. Не считано ${vdrSize - readed}. ` +
                `v0x${(<any>stream).fileversion.toString(16)}`
        );
        stream.seek(end);
    }
    return vdr;
}

export function readClassHeaderData(stream: BinaryStream): ClassHeaderData {
    const sign = stream.readWord();
    if (sign !== 0x4253) throw new FileSignatureError(sign, 0x4253);

    const version = stream.readLong();
    stream.readLong(); //magic1
    stream.readLong(); //magic2
    const name = stream.readString();
    return { name, version };
}

type ExtendedClassFields = {
    __scheme?: any;
    __image?: any;
    sourceCode?: string;
    description?: string;
    flags?: number;
    varsize?: number;
    classId?: number;
    date?: any;
};

export function readClassData(
    stream: BinaryStream,
    version: number,
    blocks: {
        readScheme?: boolean;
        readImage?: boolean;
        parseBytecode?: boolean;
    }
): ClassData {
    const res: ClassData & ExtendedClassFields = {};
    const errs: string[] = [];

    let next = stream.readWord();
    if (next == RecordType.CR_VARS1) {
        res.vars = readVars(stream);
        next = stream.readWord();
    }

    if (next == RecordType.CR_LINKS) {
        res.links = readLinks(stream);
        next = stream.readWord();
    }

    if (next == RecordType.CR_CHILDSnameXY || next == RecordType.CR_CHILDSname || next == RecordType.CR_CHILDS) {
        res.childs = readChilds(stream, version);
        next = stream.readWord();
    }

    if (next == RecordType.CR_ICON) {
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
        return readVdr(stream);
    }

    if (next == RecordType.CR_SCHEME) {
        const img = readImage(blocks.readScheme);
        if (img) {
            res.__scheme = img.__vdr;
            res.scheme = img.vdr;
        }
        next = stream.readWord();
    }

    if (next == RecordType.CR_IMAGE) {
        const img = readImage(blocks.readImage);
        if (img) {
            res.__image = img.__vdr;
            res.image = img.vdr;
        }
        next = stream.readWord();
    }

    if (next == RecordType.CR_TEXT) {
        res.sourceCode = stream.readString();
        next = stream.readWord();
    }

    if (next == RecordType.CR_INFO) {
        res.description = stream.readString();
        next = stream.readWord();
    }

    if (next == RecordType.CR_VARSIZE) {
        res.varsize = stream.readWord();
        next = stream.readWord();
    }

    if (next == RecordType.CR_FLAGS) {
        res.flags = stream.readLong();
        next = stream.readWord();
    }

    if (next == RecordType.CR_DEFICON) {
        res.iconIndex = stream.readWord();
        next = stream.readWord();
    }

    if (next == RecordType.CR_ICONFILE) {
        res.iconRef = stream.readString();
        next = stream.readWord();
    }

    if (next == RecordType.CR_CODE) {
        const codesize = stream.readLong();

        const _start = stream.position;
        const _end = _start + codesize * 2;
        // if (blocks.bytecode) res.bytecode = stream.readBytes(codesize * 2);
        // stream.seek(_start);
        if (blocks.parseBytecode) res.bytecode = parseBytecode(stream, codesize);
        else stream.seek(_end);
        if (stream.position !== _end) {
            errs.push(`Конвертация кода: считано ${stream.position - _start} вместо ${codesize * 2}`);
        }

        stream.seek(_end);
        next = stream.readWord();
    }

    if (next == RecordType.CR_EQU) {
        throw new NotImplementedError("Блок уравнений не поддерживается");
        // const code = stream.readWord();
        // let b = 0;
        // if (code == EC_VAR) {
        //     const index = stream.readWord();
        //     const eqflag = stream.readWord();
        // }
        // if (code == EC_CONST)
        //     const value = stream.readBytes(8);
        // const byte = stream.readBytes(1);

        // if (code && code != EC_VAR && items){
        //     b=1;
        //     st.Write(&b,1);
        //     items->Store(st);
        // }
        // if (next){
        //     b=2;
        //     st.Write(&b,1);
        //     next->Store(st);
        // }
        // b=0;st.Write(&b,1);
    }

    if (next != RecordType.CR_CLASSTIME && version === 0x3003)
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
