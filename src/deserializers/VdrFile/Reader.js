import { readNext } from './Collection';
import consts from './consts';
import DataChunk from './DataChunk';
//space2d: 1859
function readOldFormat(stream, res, _pos){
    const mainpos = stream.readLong() + _pos;
    const toolPos = stream.readLong() + _pos;

    res.org = stream.readPoint2D();
    res.scale_div = stream.readPoint2D();
    res.scale_mul = stream.readPoint2D();

    stream.readString(); //path

    res.state = stream.readWord();

    // const name = stream.readString();
    // const author = stream.readString();
    // const description = stream.readString();

    // const brush = stream.readWord();

    stream.seek(mainpos);

    const {data: primData} = readNext(stream, true, consts.otPRIMARYCOLLECTION);
    const {data: objData} = readNext(stream, true, consts.otOBJECTCOLLECTION);

    res.otPRIMARYCOLLECTION = primData;
    res.otOBJECTCOLLECTION = objData;

    stream.seek(toolPos);
    const cc = stream.readWord();

    for(let i = 0; i < cc; i++) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }

    //Здесь еще не доделано, см space2d: 1908
    // throw 'not supported yet ';
}

function readNewFormat(stream, res) {
    const root = new DataChunk(stream);
    if(root.code != consts.stSPACEDATA)
        throw 'dont know watta do'

    res.org = stream.readPoint2D();
    res.scale_div = stream.readPoint2D();
    res.scale_mul = stream.readPoint2D();
    res.state = stream.readWord();
    res.brushHandle = stream.readWord();
    res.layers = stream.readBytes(4);
    res.defaultFlags = stream.readWord();

    while(root.hasData()) {
        const { type, data } = readNext(stream, true);
        res[type] = data;
    }

    root.checkReaded();
}

function readVectorDraw(stream) {

    const signature = stream.readWord();
    if(signature !== 0x4432)
        throw Error(`Signature error: 0x${signature.toString(16)} is not Stratum Vector Graphics (0x4432)`);

    const _pos = stream.position;

    const res = {
        fileversion: stream.readWord(),
        minVersion: stream.readWord(),
    };

    stream.fileversion = res.fileversion;

    if(res.fileversion < 0x0300)
        readOldFormat(stream, res, _pos);
    else
        readNewFormat(stream, res);
        // throw 'dont know how to read fileversion 0x' + fv.toString(16);
    return res;
}

//Конвертирует говносхему в нормальную
function convertScheme(scheme) {
    const res = {
        topLeft: scheme.org,
    };

    const {brushHandle} = scheme;

    if(brushHandle) res.brushHandle = brushHandle;

    const mapThis = (name, newName, func) => scheme[name] && (res[newName] = scheme[name].map(func));

    const arrayThis = (name, newName, func, extr) => {
        if(!scheme[name]) return;
        const conv = scheme[name].map(func);
        const result = new Map();
        conv.forEach(el => {
            const {handle} = el;
            if(!handle)
                throw Error('Null handle!');
            delete el.handle;
            result.set(handle ,extr ? el[extr] : el);
        });
        res[newName] = result;
    };

    arrayThis('otBRUSHCOLLECTION', 'brushes', ({handle, color, style}) => ({handle, color, style}));
    arrayThis('otPENCOLLECTION', 'pens', ({handle, color, style}) => ({handle, color, style}));
    arrayThis('otDOUBLEDIBCOLLECTION', 'imageSources', ({handle, path}) => ({handle, path}), 'path');
    arrayThis('otSTRINGCOLLECTION', 'strings', ({handle, text}) => ({handle, text}), 'text');
    arrayThis('otFONTCOLLECTION', 'fonts', ({handle, OldLogfont, fontSize}) => ({handle, OldLogfont, fontSize}));
    arrayThis('otTEXTCOLLECTION', 'texts', ({handle, textCollecton: {data}}) => ({handle, data}), 'data');
    arrayThis('otOBJECTCOLLECTION', 'elements', obj => obj);
    if(res.elements)res.elements.forEach(o => { switch(o.type) {
        case "otGROUP2D": o.type = 'group'; break;
        case "otDOUBLEBITMAP2D": case "otBITMAP2D": o.type = 'bitmap'; break;
        case "otLINE2D": o.type = "line"; break;
        case "otTEXT2D": o.type = "text"; break;
        case "otCONTROL2D": o.type = "control"; break;
        default: throw new Error(`Неизвестный графический элемент: ${o.type}`);
    }});
    res.elementOrder = scheme.otPRIMARYCOLLECTION;
    res.composed = false;
    return res;
}

export default function readStratumVectorDraw(stream) {
    const originalScheme = readVectorDraw(stream);
    return { originalScheme, scheme: convertScheme(originalScheme) };
}