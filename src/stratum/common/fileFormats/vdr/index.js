import { readNext, readAsCollection } from "./Collection";
import { VdrEntry } from "./vdrEntry";
import { DataChunk } from "./DataChunk";
import { FileSignatureError } from "../../errors";

function read3xFormat(stream, res) {
    const root = new DataChunk(stream);
    if (root.code !== VdrEntry.stSPACEDATA) throw "Ошибка в чтении VDR формата 3x";

    res.origin = stream.readPoint2D();
    res.scale_div = stream.readPoint2D();
    res.scale_mul = stream.readPoint2D();
    res.state = stream.readWord();
    res.brushHandle = stream.readWord();
    res.layers = stream.readULong();
    res.defaultFlags = stream.readWord();

    while (root.hasData()) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }
    root.checkReaded();
}

//space2d: 1859
function read2xFormat(stream, res, _pos) {
    const mainpos = stream.readLong() + _pos;
    const toolPos = stream.readLong() + _pos;

    const readPoint = () => (stream.fileversion < 0x200 ? stream.readIntegerPoint2D() : stream.readPoint2D());

    res.origin = readPoint();
    res.scale_div = readPoint();
    res.scale_mul = readPoint();

    stream.readString(); //path

    res.state = stream.readWord();

    stream.readString(); //name
    stream.readString(); //author
    stream.readString(); //description

    readNext(stream, false);
    readNext(stream, false);

    res.brushHandle = stream.readWord();

    stream.seek(mainpos);

    // console.dir(res);
    // if(stream.fileversion === 0x103) throw 'stop'

    res.otPRIMARYCOLLECTION = readNext(stream, true, VdrEntry.otPRIMARYCOLLECTION).data;
    res.otOBJECTCOLLECTION = readNext(stream, true, VdrEntry.otOBJECTCOLLECTION).data;

    stream.seek(toolPos);
    const cc = stream.readWord();

    for (let i = 0; i < cc; i++) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }

    //Здесь еще не доделано, см space2d: 1908
    if (stream.fileversion > 0x0102) {
        res.layers = stream.readULong();
        res.defaultFlags = stream.readWord();
        let code = stream.readWord();
        while (code) {
            switch (code) {
                // case 1:
                // stream.readWord(); //objectHandle
                // readAsCollection(stream, "otDATAITEMS");
                case 0:
                    break;
                default:
                    return;
            }
            code = stream.readWord();
        }
    } else {
        res.layers = 0;
        res.defaultFlags = 0;
    }
    stream.readString(); //Должна быть "End Of File <!>"
}

//space2d.cpp:1761, 2122
function _readVectorDrawing(stream) {
    const signature = stream.readWord();
    if (signature !== 0x4432) throw new FileSignatureError(signature, 0x4432);

    const _pos = stream.position;

    const res = {
        fileversion: stream.readWord(),
        minVersion: stream.readWord(),
    };

    stream.fileversion = res.fileversion;

    if (res.fileversion >= 0x0300) read3xFormat(stream, res);
    else read2xFormat(stream, res, _pos);

    return res;
}

const map = {
    otBRUSHCOLLECTION: "brushTools",
    otPENCOLLECTION: "penTools",
    otDIBCOLLECTION: "bitmapTools",
    otDOUBLEDIBCOLLECTION: "doubleBitmapTools",
    otSTRINGCOLLECTION: "stringTools",
    otFONTCOLLECTION: "fontTools",
    otTEXTCOLLECTION: "textTools",
    otOBJECTCOLLECTION: "elements",
    otPRIMARYCOLLECTION: "elementOrder",
};

function mapNames(vdr) {
    for (const oldKey of Object.keys(vdr)) {
        const newKey = map[oldKey];
        if (!newKey) continue;
        const data = vdr[oldKey];
        delete vdr[oldKey];
        vdr[newKey] = data;
    }
    return vdr;
}

export function readVdrFile(stream, source) {
    const res = mapNames(_readVectorDrawing(stream));
    res.source = source;
    return res;
}
