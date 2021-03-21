import { BinaryReader } from "stratum/helpers/binaryReader";
import { VectorDrawingElement } from ".";
import {
    readBitmap,
    readControl,
    readCrdSystem,
    readGroup,
    readHyper,
    readLine,
    readNumber,
    readSettingCollection,
    readTBrush,
    readTDib,
    readTDoubleDib,
    readText,
    readTFont,
    readTPen,
    readTString,
    readTText,
} from "./readers";
import { VectorDrawingBase } from "./types/vectorDrawing";
import { VdrEntry } from "./vdrEntry";

export type CollectionItemReader<T> = (code: number, reader: BinaryReader, version: number) => T;

export class DataChunk {
    private reader: BinaryReader;
    private start: number;
    private size: number;
    readonly code: number;
    readonly version: number;
    constructor(reader: BinaryReader, version: number, private name: string) {
        this.reader = reader;
        this.version = version;
        this.start = reader.pos();
        this.code = reader.int16();
        this.size = version >= 0x300 ? reader.int32() : 0;
    }

    goEnd() {
        this.reader.seek(this.start + this.size);
    }

    // _collect.cpp:240
    readToolCollection<T>(itemReader: CollectionItemReader<T>): T[] {
        const length = this.reader.uint16();
        this.reader.skip(7); //limit,delta,dupl,current

        return Array.from({ length }, () => {
            const chunk = new DataChunk(this.reader, this.version, "Инструмент");
            this.reader.skip(2); //refCount
            const res = itemReader(chunk.code, this.reader, this.version);
            chunk.checkReaded();
            return res;
        });
    }

    readElementCollection(): VectorDrawingElement[] {
        const length = this.reader.uint16();
        this.reader.skip(7); //limit,delta,dupl,current

        return Array.from({ length }, () => {
            const { reader, version } = this;
            const chunk = new DataChunk(reader, version, "Граф. объект");

            let element: VectorDrawingElement;
            switch (chunk.code) {
                case VdrEntry.otGROUP2D:
                    element = readGroup(reader, version);
                    break;
                case VdrEntry.otLINE2D:
                    element = readLine(reader, version);
                    break;
                case VdrEntry.otBITMAP2D:
                    element = readBitmap(reader, version, "bitmap");
                    break;
                case VdrEntry.otDOUBLEBITMAP2D:
                    element = readBitmap(reader, version, "doubleBitmap");
                    break;
                case VdrEntry.otTEXT2D:
                    element = readText(reader, version);
                    break;
                case VdrEntry.otCONTROL2D:
                    element = readControl(reader, version);
                    break;
                default:
                    throw Error(`Неизвестный объект: ${VdrEntry[chunk.code]}`);
            }
            if (version < 0x300) return element;

            while (chunk.hasData()) {
                const chunk = new DataChunk(this.reader, this.version, "Дополнительные данные");
                chunk.readElementData(element);
                chunk.checkReaded();
            }
            chunk.checkReaded();
            return element;
        });
    }

    readElementData(element: VectorDrawingElement) {
        switch (this.code) {
            case VdrEntry.otDATAITEMS:
                readSettingCollection(this.reader, (id, size, reader) => {
                    if (id === 10) {
                        element.hyperbase = readHyper(reader, size);
                        return;
                    }
                    console.warn(`Неизвестные данные в объекте ${element.handle}: id ${id}, ${size} байтов`);
                    reader.skip(size);
                    return;
                });
                break;
            case VdrEntry.stOBJNAME:
                element.name = this.reader.fixedString(this.size - 6);
                break;
        }
    }

    readCollection<T>(reader: (reader: BinaryReader) => T): T[] {
        const length = this.reader.uint16();
        this.reader.skip(4); //limit,delta
        return Array.from({ length }, () => reader(this.reader));
    }

    readObject(res: VectorDrawingBase) {
        // space2d.cpp:1763
        // _system.cpp:2787
        switch (this.code) {
            case 1004:
                res.penTools = this.readToolCollection(readTPen);
                break;
            case 1005:
                res.brushTools = this.readToolCollection(readTBrush);
                break;
            case 1006:
                res.dibTools = this.readToolCollection(readTDib);
                break;
            case 1007:
                res.doubleDibTools = this.readToolCollection(readTDoubleDib);
                break;
            case 1008:
                res.fontTools = this.readToolCollection(readTFont);
                break;
            case 1009:
                res.stringTools = this.readToolCollection(readTString);
                break;
            case 1010:
                res.textTools = this.readToolCollection(readTText);
                break;
            case 1012:
                // space2d.cpp:1772
                throw Error("Чтение 3D-фреймов не реализовано"); // this.goEnd();
            case VdrEntry.otPRIMARYCOLLECTION:
                res.elementOrder = this.readCollection(readNumber);
                break;
            case VdrEntry.otOBJECTCOLLECTION:
                res.elements = this.readElementCollection();
                break;
            case VdrEntry.otDATAITEMS:
                res.settings = readSettingCollection(this.reader, (id, size, reader) => ({
                    id,
                    data: reader.bytes(size),
                }));
                break;

            case VdrEntry.ctINFONAME:
                // res.info = this.stream.string();
                this.goEnd();
                break;
            case VdrEntry.ctINFOAUTOR:
                // res.author = this.stream.string();
                this.goEnd();
                break;
            case VdrEntry.ctINFOINFO:
                // res.description = this.stream.string();
                this.goEnd();
                break;
            case VdrEntry.ctCRDSYSTEM:
                res.crdSystem = readCrdSystem(this.reader);
                break;
            default:
                console.warn(`${VdrEntry[this.code]} игнорируется`);
                this.goEnd();
        }
    }

    hasData() {
        return this.size > this.readedBytes();
    }

    readedBytes() {
        return this.reader.pos() - this.start;
    }

    checkReaded() {
        if (this.version < 0x300) return;
        const bytes = this.readedBytes();
        if (bytes > this.size) throw Error(`Chunk ${this.name} data out of range: ${bytes} instead of ${this.size}`);
        if (bytes < this.size) throw Error(`Chunk ${this.name} not readed: ${bytes} instead of ${this.size}`);
    }
}
