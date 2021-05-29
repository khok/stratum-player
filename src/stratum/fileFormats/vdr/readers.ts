import { BinaryReader } from "stratum/helpers/binaryReader";
import { readBmpFile, readDbmFile } from "../bmp";
import { DataChunk } from "./DataChunk";
import { CoordinateSystem } from "./types/vectorDrawing";
import {
    BitmapElement,
    ControlElement,
    DoubleBitmapElement,
    EditFrame,
    Element2dBase,
    ElementBase,
    GroupElement,
    Hyperbase,
    LineElement,
    TextElement,
    View3D,
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

export function readTPen(code: number, reader: BinaryReader): PenToolParams {
    if (code !== VdrEntry.ttPEN2D) throw Error("Ошибка чтения инструмента Pen");
    return {
        handle: reader.uint16(),
        color: reader.int32(),
        style: reader.int16(),
        width: reader.int16(),
        rop2: reader.int16(),
    };
}
export function readTBrush(code: number, reader: BinaryReader): BrushToolParams {
    if (code !== VdrEntry.ttBRUSH2D) throw Error("Ошибка чтения инструмента Brush");
    return {
        handle: reader.uint16(),
        color: reader.int32(),
        style: reader.int16(),
        hatch: reader.int16(),
        rop2: reader.int16(),
        dibHandle: reader.uint16(),
    };
}
export function readTDib(code: number, reader: BinaryReader): DibToolParams | ExternalDibToolParams {
    switch (code) {
        case VdrEntry.ttDIB2D:
            return {
                type: "image",
                handle: reader.uint16(),
                img: readBmpFile(reader),
            };
        case VdrEntry.ttREFTODIB2D:
            return {
                type: "BMPReference",
                handle: reader.uint16(),
                filename: reader.string(),
            };
        default:
            throw Error("Ошибка чтения инструмента Dib");
    }
}
export function readTDoubleDib(code: number, reader: BinaryReader): DoubleDibToolParams | ExternalDoubleDibToolParams {
    switch (code) {
        case VdrEntry.ttDOUBLEDIB2D:
            return {
                type: "image",
                handle: reader.uint16(),
                img: readDbmFile(reader),
            };
        case VdrEntry.ttREFTODOUBLEDIB2D:
            return {
                type: "DBMReference",
                handle: reader.uint16(),
                filename: reader.string(),
            };
        default:
            throw Error("Ошибка чтения инструмента DoubleDib");
    }
}

export function readTFont(code: number, reader: BinaryReader, version: number): FontToolParams {
    if (code !== VdrEntry.ttFONT2D) throw Error("Ошибка чтения инструмента Font");

    const pos = reader.pos();
    //Структуру искать как typedef struct tagOldLOGFONT
    const res: FontToolParams = {
        handle: reader.uint16(),
        height: reader.int16(),
        width: reader.int16(),
        escapement: reader.int16(),
        orientation: reader.int16(),
        weight: reader.int16(),
        italic: reader.byte(),
        underline: reader.byte(),
        strikeOut: reader.byte(),
        charSet: reader.byte(),
        outPrecision: reader.byte(),
        clipPrecision: reader.byte(),
        quality: reader.byte(),
        pitchAndFamily: reader.byte(),
        fontName: reader.nulltString(32),
    };
    // reader.seek(pos + 52);

    if (version >= 0x0203) {
        res.size = reader.int32();
        res.style = reader.int32();
    } /* else {
        res.size = 22;
        res.style = 0;
    }*/
    return res;
}

export function readTString(code: number, reader: BinaryReader): StringToolParams {
    if (code !== VdrEntry.ttSTRING2D) throw Error("Ошибка чтения инструмента String");
    return {
        handle: reader.uint16(),
        text: reader.string(),
    };
}

function readTextFragment(reader: BinaryReader) {
    return {
        fgColor: reader.int32(),
        bgColor: reader.int32(),
        fontHandle: reader.uint16(),
        stringHandle: reader.uint16(),
    };
}

export function readTText(code: number, reader: BinaryReader, version: number): TextToolParams {
    if (code !== VdrEntry.ttTEXT2D) throw Error("Ошибка чтения инструмента Text");
    const handle = reader.uint16();

    const chunk = new DataChunk(reader, version, "Коллекция текстовых фрагментов");
    const textCollection = chunk.readCollection(readTextFragment);
    chunk.checkReaded();
    return { handle, textCollection };
}

export function readNumber(reader: BinaryReader): number {
    return reader.uint16();
}

function readElement(reader: BinaryReader, version: number): ElementBase {
    const res: ElementBase = {
        handle: reader.uint16(),
        options: reader.uint16(),
    };
    if (version >= 0x0102 && version < 0x0300) {
        res.name = reader.string();
    }
    return res;
}

function readElement2d(reader: BinaryReader, version: number): Element2dBase {
    if (version < 0x200) {
        return {
            ...readElement(reader, version),
            originX: reader.int16(),
            originY: reader.int16(),
            width: reader.int16(),
            height: reader.int16(),
        };
    } else {
        return {
            ...readElement(reader, version),
            originX: reader.float64(),
            originY: reader.float64(),
            width: reader.float64(),
            height: reader.float64(),
        };
    }
}

export function readGroup(reader: BinaryReader, version: number): GroupElement {
    const base = readElement(reader, version);
    const chunk = new DataChunk(reader, version, "Элементы группы");
    const childHandles = chunk.readCollection(readNumber);
    chunk.checkReaded();
    return { type: "group", ...base, childHandles };
}
// function read_otRGROUP2D(reader : Binaryreader, version : number) {
// throw Error('not here');
// return readObject(reader, version);
// }

// function read_otGROUP3D(reader : Binaryreader, version : number) {
//     throw Error('otGROUP3D not supported');
// }
// function read_otOBJECT3D(reader : Binaryreader, version : number) {
//     throw Error('otOBJECT3D not supported');
// }
// function read_otCAMERA3D(reader : Binaryreader, version : number) {
//     throw Error('otCAMERA3D not supported');
// }
// function read_otLIGHT3D(reader : Binaryreader, version : number) {
//     throw Error('otLIGHT3D not supported');
// }

export function readLine(reader: BinaryReader, version: number): LineElement {
    const base = readElement2d(reader, version);
    const penHandle = reader.uint16();
    const brushHandle = reader.uint16();

    const coordCount = reader.uint16() * 2;

    const coords = new Array(coordCount);
    for (let i = 0; i < coordCount; i += 2) {
        if (version < 0x200) {
            coords[i + 0] = reader.int16();
            coords[i + 1] = reader.int16();
        } else {
            coords[i + 0] = reader.float64();
            coords[i + 1] = reader.float64();
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
        const size = reader.byte();
        if (size > 0) {
            res.arrows = reader.bytes(size);
        }
    }
    return res;
}

export function readBitmap<T extends BitmapElement | DoubleBitmapElement>(reader: BinaryReader, version: number, type: T["type"]) {
    return {
        type,
        ...readElement2d(reader, version),
        cropX: version < 0x200 ? reader.int16() : reader.float64(),
        cropY: version < 0x200 ? reader.int16() : reader.float64(),
        cropW: version < 0x200 ? reader.int16() : reader.float64(),
        cropH: version < 0x200 ? reader.int16() : reader.float64(),
        angle: reader.int16(),
        dibHandle: reader.uint16(),
    };
}

export function readText(reader: BinaryReader, version: number): TextElement {
    return {
        type: "text",
        ...readElement2d(reader, version),
        textToolHandle: reader.uint16(),
        delta: reader.point2d(version < 0x200),
        angle: reader.int16(),
    };
}
// function read_otVIEW3D2D(reader : Binaryreader, version : number) {
//     throw Error('otVIEW3D2D not supported');
// }
// function read_otUSEROBJECT2D(reader : Binaryreader, version : number) {
//     throw Error('otUSEROBJECT2D not implemented');
//     return readObject2D(reader : Binaryreader, version : number);
// }

//WINOBJ2D.cpp -> 29
export function readControl(reader: BinaryReader, version: number): ControlElement {
    const base = readElement2d(reader, version);
    const t = reader.string();
    const inputType = t.toUpperCase();

    if (inputType !== "EDIT" && inputType !== "BUTTON" && inputType !== "COMBOBOX") {
        throw Error(`Неизвестный тип элемента Control #${base.handle}: ${t}`);
    }

    const res: ControlElement = {
        type: "control",
        ...base,
        inputType,
        text: reader.string(),
        dwStyle: reader.int32(),
        exStyle: reader.int32(),
        id: reader.uint16(),
        controlSize: reader.point2d(true),
    };
    reader.uint16(); //unused
    return res;
}

export function readView3D(reader: BinaryReader, version: number): View3D {
    return {
        type: "view3D",
        ...readElement2d(reader, version),
        spaceHandle: reader.uint16(),
        cameraHandle: reader.uint16(),
    };
}

export function readEditFrame(reader: BinaryReader, version: number): EditFrame {
    return {
        type: "editFrame",
        ...readElement2d(reader, version),
        objectHandle: reader.uint16(),
        size: reader.point2d(version < 0x200),
    };
}

// WINMAP.CPP:3079
// const UINT H_TARGET  = 1;
// const UINT H_WINNAME = 2;
// const UINT H_OBJECT  = 3;
// const UINT H_MODE    = 4;
// const UINT H_EFFECT  = 5;
// const UINT H_TIME    = 6;
// const UINT H_DISABLED =7;
// const UINT H_ADD      =8;
export function readHyper(reader: BinaryReader, size: number): Hyperbase {
    const res: Hyperbase = {};
    let code = 0;
    const end = reader.pos() + size;
    while (reader.pos() < end && (code = reader.uint16()) !== 0) {
        switch (code) {
            case 1:
                res.target = reader.string();
                break;
            case 2:
                res.windowName = reader.string();
                break;
            case 3:
                res.objectName = reader.string();
                break;
            case 4:
                res.openMode = reader.uint16();
                break;
            case 5:
                res.effect = reader.string();
                break;
            case 6:
                res.time = reader.uint16();
                break;
            case 7:
                res.disabled = true;
                break;
            case 8:
                res.params = reader.string();
                break;
        }
    }
    return res;
}

export type SettingItemReader<T> = (id: number, size: number, reader: BinaryReader) => T;
export function readSettingCollection<T>(reader: BinaryReader, itemReader: SettingItemReader<T>): T[] {
    const length = reader.uint16();
    reader.skip(5); //limit, delta, dup

    return Array.from({ length }, () => {
        const id = reader.uint16();
        const size = reader.uint16();
        return itemReader(id, size, reader);
    });
}

export function readCrdSystem(reader: BinaryReader, version: number): CoordinateSystem {
    return {
        type: reader.uint16(),
        objectHandle: reader.int16(),
        center: reader.point2d(version < 0x200),
        matrix: Array.from({ length: 9 }, () => reader.float64()),
    };
}
