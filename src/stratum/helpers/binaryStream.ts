const decoder = new TextDecoder("windows-1251");
function decodeString(bytes: ArrayBuffer) {
    // return encode(decode(bytes, "win1251"), "utf8").toString();
    return decoder.decode(bytes);
}

export class BinaryStream {
    private pos: number = 0;
    private view: DataView;
    constructor(data: ArrayBuffer, from?: number, length?: number) {
        this.view = new DataView(data, from, length);
    }

    get position() {
        return this.pos;
    }

    EOF() {
        return this.pos >= this.view.byteLength;
    }

    seek(pos: number) {
        this.pos = pos;
    }

    readBytes(size: number) {
        const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, size);
        this.pos += size;
        return bytes;
    }

    readFixedString(size: number) {
        return size > 0 ? decodeString(this.readBytes(size)) : "";
    }

    substream(length: number) {
        return new BinaryStream(this.view.buffer, this.pos, length);
    }

    readByte() {
        const byte = this.view.getUint8(this.pos);
        this.pos += 1;
        return byte;
    }

    readInt16() {
        const word = this.view.getInt16(this.pos, true);
        this.pos += 2;
        return word;
    }

    readWord() {
        const word = this.view.getUint16(this.pos, true);
        this.pos += 2;
        return word;
    }

    readLong() {
        const long = this.view.getInt32(this.pos, true);
        this.pos += 4;
        return long;
    }

    readDouble() {
        const double = this.view.getFloat64(this.pos, true);
        this.pos += 8;
        return double;
    }

    /**
     * Нуль-терминированная строка.
     */
    readCharSeq() {
        const strStart = this.pos;
        let size = 0;
        while (this.view.getUint8(strStart + ++size) !== 0);

        const value = this.readFixedString(size);
        this.pos += 1; //нуль-терминатор
        return value;
    }

    //Используется в коде ВМ, где количество байт всегда кратно 2
    readStringTrimmed() {
        const size = this.readWord() * 2;

        //после строки может идти 1 или 2 нуль-терминатора.
        const nullt = this.view.getUint8(this.pos + size - 2) === 0 ? 2 : 1;

        const value = this.readFixedString(size - nullt);
        this.pos += nullt;
        return value;
    }

    readString() {
        return this.readFixedString(this.readWord());
    }

    readPoint2D() {
        return {
            x: this.readDouble(),
            y: this.readDouble(),
        };
    }

    readIntegerPoint2D() {
        return {
            x: this.readInt16(),
            y: this.readInt16(),
        };
    }
}
