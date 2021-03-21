import { BinaryStream, FileSignatureError } from "stratum/helpers/binaryStream";
import { DataChunk } from "./DataChunk";
import { VDRSource, VectorDrawing, VectorDrawingBase } from "./types/vectorDrawing";
import { VdrEntry } from "./vdrEntry";

// space2d:1747
function read3xFormat(stream: BinaryStream, version: number): VectorDrawingBase {
    const root = new DataChunk(stream, version, "VDR");
    if (root.code !== VdrEntry.stSPACEDATA) throw Error("Ошибка в чтении VDR формата 3x");

    const res: VectorDrawingBase = {
        version,
        origin: stream.point2d(),
        scaleDiv: stream.point2d(),
        scaleMul: stream.point2d(),
        state: stream.uint16(),
        brushHandle: stream.uint16(),
        layers: stream.uint32(),
        flags: stream.uint16(),
    };

    while (root.hasData()) {
        const chunk = new DataChunk(stream, version, "");
        chunk.readObject(res);
        chunk.checkReaded();
    }
    root.checkReaded();

    return res;
}

//space2d: 1806
function read2xFormat(stream: BinaryStream, version: number, start: number): VectorDrawingBase {
    const mainpos = stream.int32() + start;
    const toolPos = stream.int32() + start;

    const readPoint = () => (version < 0x200 ? stream.point2dInt() : stream.point2d());

    const origin = readPoint();
    const scaleDiv = readPoint();
    const scaleMul = readPoint();

    stream.string(); //path

    const state = stream.uint16();

    stream.string(); //name
    stream.string(); //author
    stream.string(); //description

    new DataChunk(stream, version, "RCenter").goEnd();
    new DataChunk(stream, version, "Frame").goEnd();

    const brushHandle = stream.uint16();

    const res: VectorDrawingBase = {
        version,
        origin,
        scaleDiv,
        scaleMul,
        state,
        flags: 0,
        brushHandle,
        layers: 0,
    };

    stream.seek(mainpos);

    // console.dir(res);
    // if(stream.version === 0x103) throw 'stop'

    new DataChunk(stream, version, "Порядок объектов").readObject(res);
    new DataChunk(stream, version, "Коллекция объектов").readObject(res);

    stream.seek(toolPos);
    const cc = stream.uint16();

    for (let i = 0; i < cc; i++) {
        new DataChunk(stream, version, "").readObject(res);
    }

    //Здесь еще не доделано, см space2d: 1845
    if (version > 0x0102) {
        res.layers = stream.uint32();
        res.flags = stream.uint16();

        let code: number;
        while ((code = stream.uint16()) !== 0) {
            switch (code) {
                case 1:
                    const handle = stream.uint16();
                    const obj = res.elements?.find((e) => e.handle === handle);
                    if (!obj) throw Error(`Объект ${handle} не найден на схеме`);
                    new DataChunk(stream, version, "Дополнительные данные").readElementData(obj);
                    break;
                case 2:
                    new DataChunk(stream, version, "Дополнительные данные").readObject(res);
                    break;
                default:
                    return res;
            }
        }
    }
    stream.string(); //Должна быть "End Of File <!>"
    return res;
}

//space2d.cpp:1761, 2122
// space2d.cpp: 1729
/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 */
export function readVdrFile(stream: BinaryStream, source: VDRSource, info = true): VectorDrawing {
    const signature = stream.uint16();
    if (signature !== 0x4432) throw new FileSignatureError(stream, signature, 0x4432);

    const start = stream.pos();

    const version = stream.uint16();
    stream.skip(2); //mver;
    const vdr = (version < 0x0300 ? read2xFormat(stream, version, start) : read3xFormat(stream, version)) as VectorDrawing;

    vdr.source = source;
    if (!info) return vdr;

    const diff = stream.size() - stream.pos();
    if (diff !== 0) {
        const msg = `${stream.name}: считано ${stream.pos()} байтов, не считано ${diff}. v0x${vdr.version.toString(16)}.`;
        console.warn(msg);
    }
    return vdr;
}
