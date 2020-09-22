import { Point2D } from "./types";

const decoder = new TextDecoder("windows-1251");

export class BinaryStream {
    private pos: number = 0;
    private view: DataView;

    readonly filename: string;
    fileversion: number = 0;
    constructor(data: ArrayBuffer, filename?: string, from?: number, length?: number) {
        this.view = new DataView(data, from, length);
        this.filename = filename || "";
    }

    get position(): number {
        return this.pos;
    }

    get size(): number {
        return this.view.byteLength;
    }

    EOF(): boolean {
        return this.pos >= this.size;
    }

    seek(pos: number): void {
        this.pos = pos;
    }

    readBytes(size: number): Uint8Array {
        const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, size);
        this.pos += size;
        return bytes;
    }

    substream(length: number, filename?: string): BinaryStream {
        return new BinaryStream(this.view.buffer, filename || this.filename, this.pos, length);
    }

    readByte(): number {
        const byte = this.view.getUint8(this.pos);
        this.pos += 1;
        return byte;
    }

    readInt16(): number {
        const word = this.view.getInt16(this.pos, true);
        this.pos += 2;
        return word;
    }

    readWord(): number {
        const word = this.view.getUint16(this.pos, true);
        this.pos += 2;
        return word;
    }

    readLong(): number {
        const long = this.view.getInt32(this.pos, true);
        this.pos += 4;
        return long;
    }

    readULong(): number {
        const long = this.view.getUint32(this.pos, true);
        this.pos += 4;
        return long;
    }

    readDouble(): number {
        const double = this.view.getFloat64(this.pos, true);
        this.pos += 8;
        return double;
    }

    readFixedString(size: number): string {
        return size > 0 ? decoder.decode(this.readBytes(size)) : "";
    }

    /**
     * Нуль-терминированная строка.
     * Максимальный размер строки будет составлять `limit - 1` байт.
     */
    readCharSeq(limit: number): string {
        const strStart = this.pos;
        let size = 0;
        while (size < limit - 1 && this.view.getUint8(strStart + ++size) !== 0);

        const value = this.readFixedString(size);
        this.pos += 1; //нуль-терминатор
        return value;
    }

    //Используется в коде ВМ, где количество байт всегда кратно 2
    readStringTrimmed(): string {
        const size = this.readWord() * 2;

        //после строки может идти 1 или 2 нуль-терминатора.
        const nullt = this.view.getUint8(this.pos + size - 2) === 0 ? 2 : 1;

        const value = this.readFixedString(size - nullt);
        this.pos += nullt;
        return value;
    }

    // Обычная строка вида:
    // 2 байта - размер (N);
    // N байтов - содержимое.
    readString(): string {
        return this.readFixedString(this.readWord());
    }

    readPoint2D(): Point2D {
        return {
            x: this.readDouble(),
            y: this.readDouble(),
        };
    }

    readIntegerPoint2D(): Point2D {
        return {
            x: this.readInt16(),
            y: this.readInt16(),
        };
    }
}
