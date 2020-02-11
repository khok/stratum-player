import bops from "bops";
import { decode, encode } from "iconv-lite";

function decodeString(bytes) {
    return encode(decode(bytes, "win1251"), "utf8").toString();
}

export class BinaryStream {
    constructor(data) {
        this.streamPosition = 0;
        this.data = data instanceof Uint8Array ? data : new Uint8Array(data);
    }

    EOF() {
        return this.streamPosition >= this.data.length;
    }

    seek(pos) {
        this.streamPosition = pos;
    }

    get position() {
        return this.streamPosition;
    }

    readBytes(size) {
        const bytes = bops.subarray(this.data, this.streamPosition, this.streamPosition + size);
        this.streamPosition += size;
        return bytes;
    }

    readWord() {
        const word = bops.readInt16LE(this.data, this.streamPosition);
        this.streamPosition += 2;
        return word;
    }

    readLong() {
        const long = bops.readInt32LE(this.data, this.streamPosition);
        this.streamPosition += 4;
        return long;
    }

    readColor() {
        // let color =  Array.from(this.readBytes(3)).map(b => b.toString(16)).join('');
        let color = `rgb(${this.readBytes(3)})`;
        this.streamPosition++;
        return color;
    }

    readUint() {
        const uint = bops.readUInt32LE(this.data, this.streamPosition);
        this.streamPosition += 4;
        return uint;
    }

    readDouble() {
        const double = bops.readDoubleLE(this.data, this.streamPosition);
        this.streamPosition += 8;
        return double;
    }

    //Нуль-терминированная строка
    readCharSeq() {
        const strStart = this.position;
        let size = 0;
        while (this.data[strStart + ++size] != 0x00);

        return bops.to(this.readBytes(size));
    }

    readBase64(size) {
        return bops.to(this.readBytes(size !== undefined ? size : this.data.length), "base64");
    }

    //Используется в коде ВМ, где количество байт всегда кратно 2
    readStringTrimmed() {
        const size = bops.readInt16LE(this.data, this.streamPosition);

        const strStart = this.streamPosition + 2;
        const preEnd = strStart + size * 2 - 2;
        const strEnd = preEnd + (this.data[preEnd] != 0);

        const value = decodeString(bops.subarray(this.data, strStart, strEnd));

        this.streamPosition += (size + 1) * 2;

        return value;
    }

    readFixedString(size) {
        return decodeString(this.readBytes(size));
    }

    readString() {
        const size = bops.readInt16LE(this.data, this.streamPosition);
        this.streamPosition += 2;
        if (size <= 0) return "";
        return decodeString(this.readBytes(size));
    }

    readPoint2D() {
        return {
            x: this.readDouble(),
            y: this.readDouble()
        };
    }

    readIntegerPoint2D() {
        return {
            x: this.readWord(),
            y: this.readWord()
        };
    }
}
