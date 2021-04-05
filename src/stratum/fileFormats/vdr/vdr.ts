import { BinaryReader, FileSignatureError } from "stratum/helpers/binaryReader";
import { DataChunk } from "./DataChunk";
import { VDRSource, VectorDrawing, VectorDrawingBase } from "./types/vectorDrawing";
import { VdrEntry } from "./vdrEntry";

// space2d:1747
function read3xFormat(reader: BinaryReader, version: number): VectorDrawingBase {
    const root = new DataChunk(reader, version, "VDR");
    if (root.code !== VdrEntry.stSPACEDATA) throw Error("Ошибка в чтении VDR формата 3x");

    const res: VectorDrawingBase = {
        version,
        origin: reader.point2d(),
        scaleDiv: reader.point2d(),
        scaleMul: reader.point2d(),
        state: reader.uint16(),
        brushHandle: reader.uint16(),
        layers: reader.uint32(),
        flags: reader.uint16(),
    };

    while (root.hasData()) {
        const chunk = new DataChunk(reader, version, "");
        chunk.readObject(res);
        chunk.checkReaded();
    }
    root.checkReaded();

    return res;
}

//space2d: 1806
function read2xFormat(reader: BinaryReader, version: number, start: number): VectorDrawingBase {
    const mainpos = reader.int32() + start;
    const toolPos = reader.int32() + start;

    const origin = reader.point2d(version < 0x200);
    const scaleDiv = reader.point2d(version < 0x200);
    const scaleMul = reader.point2d(version < 0x200);

    reader.string(); //path

    const state = reader.uint16();

    reader.string(); //name
    reader.string(); //author
    reader.string(); //description

    new DataChunk(reader, version, "RCenter").goEnd();
    new DataChunk(reader, version, "Frame").goEnd();

    const brushHandle = reader.uint16();

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

    reader.seek(mainpos);

    // console.dir(res);
    // if(stream.version === 0x103) throw 'stop'

    new DataChunk(reader, version, "Порядок объектов").readObject(res);
    new DataChunk(reader, version, "Коллекция объектов").readObject(res);

    reader.seek(toolPos);
    const cc = reader.uint16();

    for (let i = 0; i < cc; i++) {
        new DataChunk(reader, version, "").readObject(res);
    }

    //Здесь еще не доделано, см space2d: 1845
    if (version > 0x0102) {
        res.layers = reader.uint32();
        res.flags = reader.uint16();

        let code: number;
        while ((code = reader.uint16()) !== 0) {
            switch (code) {
                case 1:
                    const handle = reader.uint16();
                    const obj = res.elements?.find((e) => e.handle === handle);
                    if (!obj) throw Error(`Объект ${handle} не найден на схеме`);
                    new DataChunk(reader, version, "Дополнительные данные").readElementData(obj);
                    break;
                case 2:
                    new DataChunk(reader, version, "Дополнительные данные").readObject(res);
                    break;
                default:
                    return res;
            }
        }
    }
    reader.string(); //Должна быть "End Of File <!>"
    return res;
}

//space2d.cpp:1761, 2122
// space2d.cpp: 1729
/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 */
export function readVdrFile(reader: BinaryReader, source: VDRSource, info = true): VectorDrawing {
    const signature = reader.uint16();
    if (signature !== 0x4432) throw new FileSignatureError(reader, signature, 0x4432);

    const start = reader.pos();

    const version = reader.uint16();
    reader.skip(2); //mver;
    const vdr = (version < 0x0300 ? read2xFormat(reader, version, start) : read3xFormat(reader, version)) as VectorDrawing;

    vdr.source = source;
    if (!info) return vdr;

    const diff = reader.size() - reader.pos();
    if (diff !== 0) {
        const msg = `${reader.name}: считано ${reader.pos()} байтов, не считано ${diff}. v0x${vdr.version.toString(16)}.`;
        console.warn(msg);
    }
    return vdr;
}
