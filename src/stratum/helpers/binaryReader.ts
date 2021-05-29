import { Point2D } from "./types";
import { decode } from "./win1251";

export class BinaryReader {
    private v: DataView;
    private p: number;
    name: string;

    constructor(data: ArrayBuffer | ArrayBufferView, name?: string) {
        if (data instanceof ArrayBuffer) {
            this.v = new DataView(data);
        } else {
            this.v = new DataView(data.buffer, data.byteOffset, data.byteLength);
        }
        this.p = 0;
        this.name = name ?? "";
    }

    pos(): number {
        return this.p;
    }

    seek(pos: number): this {
        this.p = pos;
        return this;
    }

    skip(len: number): this {
        this.p += len;
        return this;
    }

    size(): number {
        return this.v.byteLength;
    }

    eof(): boolean {
        return this.p >= this.size();
    }

    bytes(size: number): Uint8Array {
        const bytes = new Uint8Array(this.v.buffer, this.v.byteOffset + this.p, size);
        this.p += size;
        return bytes;
    }

    byte(): number {
        const byte = this.v.getUint8(this.p);
        this.p += 1;
        return byte;
    }

    int16(): number {
        const word = this.v.getInt16(this.p, true);
        this.p += 2;
        return word;
    }

    uint16(): number {
        const word = this.v.getUint16(this.p, true);
        this.p += 2;
        return word;
    }

    int32(): number {
        const long = this.v.getInt32(this.p, true);
        this.p += 4;
        return long;
    }

    uint32(): number {
        const long = this.v.getUint32(this.p, true);
        this.p += 4;
        return long;
    }

    float64(): number {
        const double = this.v.getFloat64(this.p, true);
        this.p += 8;
        return double;
    }

    fixedString(size: number): string {
        return size > 0 ? decode(this.bytes(size)) : "";
    }

    // Обычная строка вида:
    // 2 байта - размер (N);
    // N байтов - содержимое.
    string(): string {
        return this.fixedString(this.uint16());
    }

    /**
     * Нуль-терминированная строка.
     * Максимальный размер строки будет составлять `limit - 1` байт.
     */
    nulltString(limit: number): string {
        const strStart = this.p;
        let size = 0;
        while (size < limit - 1 && this.v.getUint8(strStart + ++size) !== 0);

        const value = this.fixedString(size);
        this.p = strStart + limit;
        return value;
    }

    //Используется в коде ВМ, где количество байт всегда кратно 2
    vmString(): string {
        const size = this.uint16() * 2;

        //после строки может идти 1 или 2 нуль-терминатора.
        const nullt = this.v.getUint8(this.p + size - 2) === 0 ? 2 : 1;

        const value = this.fixedString(size - nullt);
        this.p += nullt;
        return value;
    }

    point2d(useInts?: boolean): Point2D {
        return { x: useInts ? this.int16() : this.float64(), y: useInts ? this.int16() : this.float64() };
    }
}

export class FileReadingError extends Error {
    constructor(reader: BinaryReader, message: string) {
        super(`Ошибка чтения ${reader.name || ""}:\n${message}`);
    }
}

export class FileSignatureError extends FileReadingError {
    constructor(reader: BinaryReader, signature: number, expected: number) {
        super(reader, `Сигнатура: 0x${signature.toString(16)}, ожидалось 0x${expected.toString(16)}.`);
    }
}
