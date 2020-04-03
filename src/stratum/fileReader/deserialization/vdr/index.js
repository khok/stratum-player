import { readNext } from "./Collection";
import consts from "./consts";
import DataChunk from "./DataChunk";
import { FileSignatureError } from "~/helpers/errors";

//space2d: 1859
function readOldFormat(stream, res, _pos) {
    const mainpos = stream.readLong() + _pos;
    const toolPos = stream.readLong() + _pos;

    const readPoint = () => (stream.fileversion < 0x200 ? stream.readIntegerPoint2D() : stream.readPoint2D());

    res.origin = readPoint();
    res.scale_div = readPoint();
    res.scale_mul = readPoint();

    stream.readString(); //path

    res.state = stream.readWord();

    // const name = stream.readString();
    // const author = stream.readString();
    // const description = stream.readString();

    // const brush = stream.readWord();

    stream.seek(mainpos);

    // console.dir(res);
    // if(stream.fileversion == 0x103) throw 'stop'

    const { data: primData } = readNext(stream, true, consts.otPRIMARYCOLLECTION);
    const { data: objData } = readNext(stream, true, consts.otOBJECTCOLLECTION);

    res.otPRIMARYCOLLECTION = primData;
    res.otOBJECTCOLLECTION = objData;

    stream.seek(toolPos);
    const cc = stream.readWord();

    for (let i = 0; i < cc; i++) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }

    //Здесь еще не доделано, см space2d: 1908
    // throw 'not supported yet ';
}

function readNewFormat(stream, res) {
    const root = new DataChunk(stream);
    if (root.code != consts.stSPACEDATA) throw "dont know watta do";

    res.origin = stream.readPoint2D();
    res.scale_div = stream.readPoint2D();
    res.scale_mul = stream.readPoint2D();
    res.state = stream.readWord();
    res.brushHandle = stream.readWord();
    const layers = stream.readBytes(4);
    res.layers = [!!layers[0], !!layers[1], !!layers[2], !!layers[3]];
    res.defaultFlags = stream.readWord();

    while (root.hasData()) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }
    root.checkReaded();
}

function readVectorDraw(stream) {
    const signature = stream.readWord();
    if (signature !== 0x4432) throw new FileSignatureError(signature, 0x4432);

    const _pos = stream.position;

    const res = {
        fileversion: stream.readWord(),
        minVersion: stream.readWord(),
    };

    stream.fileversion = res.fileversion;

    if (res.fileversion < 0x0300) readOldFormat(stream, res, _pos);
    else readNewFormat(stream, res);
    // throw 'dont know how to read fileversion 0x' + fv.toString(16);
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

//TODO: переписать весь код чтения VDR
export function readVectorDrawData(stream) {
    return mapNames(readVectorDraw(stream));
}
