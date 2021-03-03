import { FileSignatureError } from "stratum/helpers/binaryStream";
import { readNext } from "./Collection";
import { DataChunk } from "./DataChunk";
import { VdrEntry } from "./vdrEntry";

function read3xFormat(stream, res) {
    const root = new DataChunk(stream);
    if (root.code !== VdrEntry.stSPACEDATA) throw "Ошибка в чтении VDR формата 3x";

    res.origin = stream.point2d();
    res.scale_div = stream.point2d();
    res.scale_mul = stream.point2d();
    res.state = stream.uint16();
    res.brushHandle = stream.uint16();
    res.layers = stream.uint32();
    res.defaultFlags = stream.uint16();

    while (root.hasData()) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }
    root.checkReaded();
}

//space2d: 1859
function read2xFormat(stream, res, _pos) {
    const mainpos = stream.int32() + _pos;
    const toolPos = stream.int32() + _pos;

    const readPoint = () => (stream.version < 0x200 ? stream.point2dInt() : stream.point2d());

    res.origin = readPoint();
    res.scale_div = readPoint();
    res.scale_mul = readPoint();

    stream.string(); //path

    res.state = stream.uint16();

    stream.string(); //name
    stream.string(); //author
    stream.string(); //description

    readNext(stream, false);
    readNext(stream, false);

    res.brushHandle = stream.uint16();

    stream.seek(mainpos);

    // console.dir(res);
    // if(stream.version === 0x103) throw 'stop'

    res.otPRIMARYCOLLECTION = readNext(stream, true, VdrEntry.otPRIMARYCOLLECTION).data;
    res.otOBJECTCOLLECTION = readNext(stream, true, VdrEntry.otOBJECTCOLLECTION).data;

    stream.seek(toolPos);
    const cc = stream.uint16();

    for (let i = 0; i < cc; i++) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }

    //Здесь еще не доделано, см space2d: 1908
    if (stream.version > 0x0102) {
        res.layers = stream.uint32();
        res.defaultFlags = stream.uint16();
        let code = stream.uint16();
        while (code) {
            switch (code) {
                // case 1:
                // stream.uint16(); //objectHandle
                // readAsCollection(stream, "otDATAITEMS");
                case 0:
                    break;
                default:
                    return;
            }
            code = stream.uint16();
        }
    } else {
        res.layers = 0;
        res.defaultFlags = 0;
    }
    stream.string(); //Должна быть "End Of File <!>"
}

//space2d.cpp:1761, 2122
function _readVectorDrawing(stream) {
    const signature = stream.uint16();
    if (signature !== 0x4432) throw new FileSignatureError(stream, signature, 0x4432);

    const _pos = stream.pos();

    const res = {
        fileversion: stream.uint16(),
        minVersion: stream.uint16(),
    };

    stream.version = res.fileversion;

    if (res.fileversion >= 0x0300) read3xFormat(stream, res);
    else read2xFormat(stream, res, _pos);

    return res;
}

const map = {
    otBRUSHCOLLECTION: "brushTools",
    otPENCOLLECTION: "penTools",
    otDIBCOLLECTION: "dibTools",
    otDOUBLEDIBCOLLECTION: "doubleDibTools",
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

export function readVdrFile(stream, source, info = true) {
    const vdr = mapNames(_readVectorDrawing(stream));
    vdr.source = source;
    if (!info) return vdr;

    const diff = stream.size() - stream.pos();
    if (diff !== 0) {
        const msg = `${stream.name}: считано ${stream.pos()} байтов, не считано ${diff}. v0x${stream.version.toString(16)}.`;
        console.warn(msg);
    }
    return vdr;
}
