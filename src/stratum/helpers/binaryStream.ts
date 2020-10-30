import { Point2D } from "./types";

export interface BinaryStreamMetadata {
    filepath?: string;
    filepathDos?: string;
    fileversion?: number;
}

export class BinaryStream {
    private static d = new TextDecoder("windows-1251");
    private v: DataView;
    private p: number = 0;

    meta: BinaryStreamMetadata;
    constructor(data: ArrayBuffer | Uint8Array | DataView, meta?: BinaryStreamMetadata) {
        this.meta = { ...meta };
        this.v = data instanceof ArrayBuffer ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    get position(): number {
        return this.p;
    }

    seek(pos: number): void {
        this.p = pos;
    }

    skip(length: number): this {
        this.p += length;
        return this;
    }

    get size(): number {
        return this.v.byteLength;
    }

    fork(length?: number): BinaryStream {
        return new BinaryStream(new DataView(this.v.buffer, this.v.byteOffset + this.p, length));
    }

    eof(): boolean {
        return this.p >= this.size;
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
        return size > 0 ? BinaryStream.d.decode(this.bytes(size)) : "";
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
        this.p += 1; //нуль-терминатор
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

    point2d(): Point2D {
        return {
            x: this.float64(),
            y: this.float64(),
        };
    }

    point2dInt(): Point2D {
        return {
            x: this.int16(),
            y: this.int16(),
        };
    }
}
