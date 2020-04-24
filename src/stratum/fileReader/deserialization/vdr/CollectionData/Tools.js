import { readNext } from "../Collection";
import consts from "../consts";
import { readBitmap, readDoubleBitmap } from "~/helpers/imageOperations";

function readTools(stream) {
    return {
        refCount: stream.readWord(),
        handle: stream.readWord(),
    };
}

function read_ttPEN2D(stream) {
    return {
        ...readTools(stream),
        color: stream.readLong(),
        style: stream.readInt16(),
        width: stream.readInt16(),
        rop2: stream.readInt16(),
    };
}
function read_ttBRUSH2D(stream) {
    return {
        ...readTools(stream),
        color: stream.readLong(),
        style: stream.readInt16(),
        hatch: stream.readInt16(),
        rop2: stream.readInt16(),
        dibHandle: stream.readWord(),
    };
}

function read_ttDIB2D(stream) {
    return {
        ...readTools(stream),
        ...readBitmap(stream),
    };
}
function read_ttDOUBLEDIB2D(stream) {
    return {
        ...readTools(stream),
        ...readDoubleBitmap(stream),
    };
}
function read_ttFONT2D(stream) {
    const header = readTools(stream);
    const pos = stream.position;
    //Структуру искать как typedef struct tagOldLOGFONT
    const data = {
        ...header,
        height: stream.readInt16(),
        width: stream.readInt16(),
        escapement: stream.readInt16(),
        orientation: stream.readInt16(),
        weight: stream.readInt16(),
        italic: stream.readByte(),
        underline: stream.readByte(),
        strikeOut: stream.readByte(),
        charSet: stream.readByte(),
        outPrecision: stream.readByte(),
        clipPrecision: stream.readByte(),
        quality: stream.readByte(),
        pitchAndFamily: stream.readByte(),
        fontName: stream.readCharSeq(32),
    };
    stream.seek(pos + 50);

    if (stream.fileversion >= 0x0203) {
        data.size = stream.readLong();
        data.style = stream.readLong();
    } else {
        data.size = 22;
        data.style = 0;
    }
    return data;
}

function read_ttSTRING2D(stream) {
    return {
        ...readTools(stream),
        text: stream.readString(),
    };
}
function read_ttTEXT2D(stream) {
    return {
        ...readTools(stream),
        textCollection: readNext(stream, true, consts.otLOGTEXTCOLLECTION).data,
    };
}
function read_ttREFTODIB2D(stream) {
    return {
        ...readTools(stream),
        filename: stream.readString(),
    };
}
function read_ttREFTODOUBLEDIB2D(stream) {
    return read_ttREFTODIB2D(stream);
}
// function read_ctINFONAME(stream) {
// throw 'NIMP'
// return readTools(stream);
// }

export default function init(funcs) {
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
