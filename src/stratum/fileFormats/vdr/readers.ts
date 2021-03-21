import { BinaryStream } from "stratum/helpers/binaryStream";
import { readBmpFile, readDbmFile } from "../bmp";
import { DataChunk } from "./DataChunk";
import { CoordinateSystem } from "./types/vectorDrawing";
import {
    BitmapElement,
    ControlElement,
    DoubleBitmapElement,
    Element2dBase,
    ElementBase,
    GroupElement,
    Hyperbase,
    LineElement,
    TextElement,
} from "./types/vectorDrawingElements";
import {
    BrushToolParams,
    DibToolParams,
    DoubleDibToolParams,
    ExternalDibToolParams,
    ExternalDoubleDibToolParams,
    FontToolParams,
    PenToolParams,
    StringToolParams,
    TextToolParams,
} from "./types/vectorDrawingTools";
import { VdrEntry } from "./vdrEntry";

export function readTPen(code: number, stream: BinaryStream): PenToolParams {
    if (code !== VdrEntry.ttPEN2D) throw Error("Ошибка чтения инструмента Pen");
    return {
        handle: stream.uint16(),
        color: stream.int32(),
        style: stream.int16(),
        width: stream.int16(),
        rop2: stream.int16(),
    };
}
export function readTBrush(code: number, stream: BinaryStream): BrushToolParams {
    if (code !== VdrEntry.ttBRUSH2D) throw Error("Ошибка чтения инструмента Brush");
    return {
        handle: stream.uint16(),
        color: stream.int32(),
        style: stream.int16(),
        hatch: stream.int16(),
        rop2: stream.int16(),
        dibHandle: stream.uint16(),
    };
}
export function readTDib(code: number, stream: BinaryStream): DibToolParams | ExternalDibToolParams {
    switch (code) {
        case VdrEntry.ttDIB2D:
            return {
                type: "image",
                handle: stream.uint16(),
                img: readBmpFile(stream),
            };
        case VdrEntry.ttREFTODIB2D:
            return {
                type: "BMPReference",
                handle: stream.uint16(),
                filename: stream.string(),
            };
        default:
            throw Error("Ошибка чтения инструмента Dib");
    }
}
export function readTDoubleDib(code: number, stream: BinaryStream): DoubleDibToolParams | ExternalDoubleDibToolParams {
    switch (code) {
        case VdrEntry.ttDOUBLEDIB2D:
            return {
                type: "image",
                handle: stream.uint16(),
                img: readDbmFile(stream),
            };
        case VdrEntry.ttREFTODOUBLEDIB2D:
            return {
                type: "DBMReference",
                handle: stream.uint16(),
                filename: stream.string(),
            };
        default:
            throw Error("Ошибка чтения инструмента DoubleDib");
    }
}

export function readTFont(code: number, stream: BinaryStream, version: number): FontToolParams {
    if (code !== VdrEntry.ttFONT2D) throw Error("Ошибка чтения инструмента Font");

    const pos = stream.pos();
    //Структуру искать как typedef struct tagOldLOGFONT
    const res: FontToolParams = {
        handle: stream.uint16(),
        height: stream.int16(),
        width: stream.int16(),
        escapement: stream.int16(),
        orientation: stream.int16(),
        weight: stream.int16(),
        italic: stream.byte(),
        underline: stream.byte(),
        strikeOut: stream.byte(),
        charSet: stream.byte(),
        outPrecision: stream.byte(),
        clipPrecision: stream.byte(),
        quality: stream.byte(),
        pitchAndFamily: stream.byte(),
        fontName: stream.nulltString(32),
    };
    stream.seek(pos + 52);

    if (version >= 0x0203) {
        res.size = stream.int32();
        res.style = stream.int32();
    } /* else {
        res.size = 22;
        res.style = 0;
    }*/
    return res;
}

export function readTString(code: number, stream: BinaryStream): StringToolParams {
    if (code !== VdrEntry.ttSTRING2D) throw Error("Ошибка чтения инструмента String");
    return {
        handle: stream.uint16(),
        text: stream.string(),
    };
}

function readTextFragment(stream: BinaryStream) {
    return {
        fgColor: stream.int32(),
        bgColor: stream.int32(),
        fontHandle: stream.uint16(),
        stringHandle: stream.uint16(),
    };
}

export function readTText(code: number, stream: BinaryStream, version: number): TextToolParams {
    if (code !== VdrEntry.ttTEXT2D) throw Error("Ошибка чтения инструмента Text");
    const handle = stream.uint16();

    const chunk = new DataChunk(stream, version, "Коллекция текстовых фрагментов");
    const textCollection = chunk.readCollection(readTextFragment);
    chunk.checkReaded();
    return { handle, textCollection };
}

export function readNumber(stream: BinaryStream): number {
    return stream.uint16();
}

function readElement(stream: BinaryStream, version: number): ElementBase {
    const res: ElementBase = {
        handle: stream.uint16(),
        options: stream.uint16(),
    };
    if (version >= 0x0102 && version < 0x0300) {
        res.name = stream.string();
    }
    return res;
}

function readElement2d(stream: BinaryStream, version: number): Element2dBase {
    if (version < 0x200) {
        return {
            ...readElement(stream, version),
            originX: stream.int16(),
            originY: stream.int16(),
            width: stream.int16(),
            height: stream.int16(),
        };
    } else {
        return {
            ...readElement(stream, version),
            originX: stream.float64(),
            originY: stream.float64(),
            width: stream.float64(),
            height: stream.float64(),
        };
    }
}

export function readGroup(stream: BinaryStream, version: number): GroupElement {
    const base = readElement(stream, version);
    const chunk = new DataChunk(stream, version, "Элементы группы");
    const childHandles = chunk.readCollection(readNumber);
    chunk.checkReaded();
    return { type: "group", ...base, childHandles };
}
// function read_otRGROUP2D(stream : BinaryStream, version : number) {
// throw Error('not here');
// return readObject(stream, version);
// }

// function read_otGROUP3D(stream : BinaryStream, version : number) {
//     throw Error('otGROUP3D not supported');
// }
// function read_otOBJECT3D(stream : BinaryStream, version : number) {
//     throw Error('otOBJECT3D not supported');
// }
// function read_otCAMERA3D(stream : BinaryStream, version : number) {
//     throw Error('otCAMERA3D not supported');
// }
// function read_otLIGHT3D(stream : BinaryStream, version : number) {
//     throw Error('otLIGHT3D not supported');
// }

export function readLine(stream: BinaryStream, version: number): LineElement {
    const base = readElement2d(stream, version);
    const penHandle = stream.uint16();
    const brushHandle = stream.uint16();

    const coordCount = stream.uint16() * 2;

    const coords = new Array(coordCount);
    for (let i = 0; i < coordCount; i += 2) {
        if (version < 0x200) {
            coords[i + 0] = stream.int16();
            coords[i + 1] = stream.int16();
        } else {
            coords[i + 0] = stream.float64();
            coords[i + 1] = stream.float64();
        }
    }

    const res: LineElement = {
        type: "line",
        ...base,
        penHandle,
        brushHandle,
        coords,
    };

    if (version > 0x0200) {
        const size = stream.byte();
        if (size > 0) {
            res.arrows = stream.bytes(size);
        }
    }
    return res;
}

export function readBitmap<T extends BitmapElement | DoubleBitmapElement>(stream: BinaryStream, version: number, type: T["type"]) {
    return {
        type,
        ...readElement2d(stream, version),
        cropX: version < 0x200 ? stream.int16() : stream.float64(),
        cropY: version < 0x200 ? stream.int16() : stream.float64(),
        cropW: version < 0x200 ? stream.int16() : stream.float64(),
        cropH: version < 0x200 ? stream.int16() : stream.float64(),
        angle: stream.int16(),
        dibHandle: stream.uint16(),
    };
}

export function readText(stream: BinaryStream, version: number): TextElement {
    return {
        type: "text",
        ...readElement2d(stream, version),
        textToolHandle: stream.uint16(),
        delta: version < 0x200 ? stream.point2dInt() : stream.point2d(),
        angle: stream.int16(),
    };
}
// function read_otVIEW3D2D(stream : BinaryStream, version : number) {
//     throw Error('otVIEW3D2D not supported');
// }
// function read_otUSEROBJECT2D(stream : BinaryStream, version : number) {
//     throw Error('otUSEROBJECT2D not implemented');
//     return readObject2D(stream : BinaryStream, version : number);
// }

//WINOBJ2D.cpp -> 29
export function readControl(stream: BinaryStream, version: number): ControlElement {
    const res: ControlElement = {
        type: "control",
        ...readElement2d(stream, version),
        className: stream.string().toUpperCase(),
        text: stream.string(),
        dwStyle: stream.int32(),
        exStyle: stream.int32(),
        id: stream.uint16(),
        controlSize: stream.point2dInt(),
    };
    // if (!["EDIT", "BUTTON", "COMBOBOX"].includes(res.className)) throw Error(`Неизвестный тип контрола: ${res.className}`);
    stream.uint16(); //unused
    return res;
}

export function readHyper(stream: BinaryStream, size: number): Hyperbase {
    const res: Hyperbase = {};
    let code = 0;
    const end = stream.pos() + size;
    while (stream.pos() < end && (code = stream.uint16()) != 0) {
        switch (code) {
            case 1:
                res.target = stream.string();
                break;
            case 2:
                res.windowName = stream.string();
                break;
            case 3:
                res.objectName = stream.string();
                break;
            case 4:
                res.openMode = stream.uint16();
                break;
            case 5:
                res.effect = stream.string();
                break;
            case 6:
                res.time = stream.uint16();
                break;
            case 7:
                res.params = stream.string();
                break;
            case 8:
                res.disabled = true;
                break;
        }
    }
    return res;
}

export type SettingItemReader<T> = (id: number, size: number, stream: BinaryStream) => T;
export function readSettingCollection<T>(stream: BinaryStream, reader: SettingItemReader<T>): T[] {
    const length = stream.uint16();
    stream.skip(5); //limit, delta, dup

    return Array.from({ length }, () => {
        const id = stream.uint16();
        const size = stream.uint16();
        return reader(id, size, stream);
    });
}

export function readCrdSystem(stream: BinaryStream): CoordinateSystem {
    return {
        type: stream.uint16(),
        objectHandle: stream.int16(),
        center: stream.point2d(),
        matrix: Array.from({ length: 9 }, () => stream.float64()),
    };
}
