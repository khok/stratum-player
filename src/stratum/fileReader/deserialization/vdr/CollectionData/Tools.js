import { readNext } from "../Collection";
import consts from "../consts";
import { applyAlphaMask } from "~/helpers/imageOperations";
import { BinaryStream } from "~/helpers/binaryStream";

function readTools(stream) {
    return {
        refCount: stream.readWord(), //Выкидывается
        handle: stream.readWord()
    };
}

function read_ttPEN2D(stream) {
    return {
        ...readTools(stream),
        color: stream.readColor(), //не факт, смотреть tools2d.cpp -> 169
        style: stream.readWord(),
        width: stream.readWord(),
        rop2: stream.readWord()
    };
}
function read_ttBRUSH2D(stream) {
    return {
        ...readTools(stream),
        color: stream.readColor(),
        style: stream.readWord(),
        hatch: stream.readWord(),
        rop2: stream.readWord(),
        dibHandle: stream.readWord()
    };
}

function readBitmapSize(stream) {
    const _pos = stream.position;
    if (stream.readWord() !== 0x4d42) throw Error("ttDIB2D is not an BMP");
    const size = stream.readLong();
    stream.seek(_pos);
    return size;
}

function read_ttDIB2D(stream) {
    return {
        ...readTools(stream),
        image: stream.readBase64(readBitmapSize(stream))
    };
}
function read_ttDOUBLEDIB2D(stream) {
    const header = readTools(stream);
    const bmpBytes = stream.readBytes(readBitmapSize(stream));
    const maskBytes = stream.readBytes(readBitmapSize(stream));

    const pngImage = applyAlphaMask(bmpBytes, maskBytes);
    const image = new BinaryStream(pngImage).readBase64(pngImage.length);
    return {
        ...header,
        image
    };
}
function read_ttFONT2D(stream) {
    const data = {
        ...readTools(stream),
        OldLogfont: stream.readBytes(50) //Структуру искать как typedef struct tagOldLOGFONT
    };

    if (stream.fileversion >= 0x0203) {
        data.fontSize = stream.readLong();
        data.fontStyle = stream.readLong();
    } else {
        data.fontSize = 22;
        data.fontStyle = 0;
    }
    return data;
}

function read_ttSTRING2D(stream) {
    return {
        ...readTools(stream),
        data: stream.readString()
    };
}
function read_ttTEXT2D(stream) {
    return {
        ...readTools(stream),
        textCollection: readNext(stream, true, consts.otLOGTEXTCOLLECTION).data
    };
}
function read_ttREFTODIB2D(stream) {
    return {
        ...readTools(stream),
        filename: stream.readString()
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
