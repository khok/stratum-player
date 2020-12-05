import { readBmpFile, readDbmFile } from "../../bmp";
import { readNext } from "../Collection";
import { VdrEntry } from "../vdrEntry";

function readTools(stream) {
    return {
        refCount: stream.uint16(),
        handle: stream.uint16(),
    };
}

function read_ttPEN2D(stream) {
    return {
        ...readTools(stream),
        color: stream.int32(),
        style: stream.int16(),
        width: stream.int16(),
        rop2: stream.int16(),
    };
}
function read_ttBRUSH2D(stream) {
    return {
        ...readTools(stream),
        color: stream.int32(),
        style: stream.int16(),
        hatch: stream.int16(),
        rop2: stream.int16(),
        dibHandle: stream.uint16(),
    };
}

function read_ttDIB2D(stream) {
    return {
        ...readTools(stream),
        ...readBmpFile(stream),
    };
}
function read_ttDOUBLEDIB2D(stream) {
    return {
        ...readTools(stream),
        ...readDbmFile(stream),
    };
}
function read_ttFONT2D(stream) {
    const header = readTools(stream);
    const pos = stream.position;
    //Структуру искать как typedef struct tagOldLOGFONT
    const data = {
        ...header,
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
    stream.seek(pos + 50);

    if (stream.meta.fileversion >= 0x0203) {
        data.size = stream.int32();
        data.style = stream.int32();
    } else {
        data.size = 22;
        data.style = 0;
    }
    return data;
}

function read_ttSTRING2D(stream) {
    return {
        ...readTools(stream),
        text: stream.string(),
    };
}
function read_ttTEXT2D(stream) {
    return {
        ...readTools(stream),
        textCollection: readNext(stream, true, VdrEntry.otLOGTEXTCOLLECTION).data,
    };
}
function read_ttREFTODIB2D(stream) {
    return {
        ...readTools(stream),
        filename: stream.string(),
    };
}
function read_ttREFTODOUBLEDIB2D(stream) {
    return read_ttREFTODIB2D(stream);
}
// function read_ctINFONAME(stream) {
// throw 'NIMP'
// return readTools(stream);
// }

export function initTools(funcs) {
    funcs.ttPEN2D = read_ttPEN2D;
    funcs.ttBRUSH2D = read_ttBRUSH2D;
    funcs.ttDIB2D = read_ttDIB2D;
    funcs.ttDOUBLEDIB2D = read_ttDOUBLEDIB2D;
    funcs.ttFONT2D = read_ttFONT2D;
    funcs.ttSTRING2D = read_ttSTRING2D;
    funcs.ttTEXT2D = read_ttTEXT2D;
    funcs.ttREFTODIB2D = read_ttREFTODIB2D;
    funcs.ttREFTODOUBLEDIB2D = read_ttREFTODOUBLEDIB2D;
    // funcs.ctINFONAME = read_ctINFONAME;
}
