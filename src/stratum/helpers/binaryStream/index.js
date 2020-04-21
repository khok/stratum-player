import bops from "bops";

const decoder = new TextDecoder("windows-1251");
function decodeString(bytes) {
    // return encode(decode(bytes, "win1251"), "utf8").toString();
    return decoder.decode(bytes);
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

    readByte() {
        const byte = bops.readUInt8(this.data, this.streamPosition);
        this.streamPosition += 1;
        return byte;
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
        const bytes = this.readBytes(4);
        const baseColor = `${bytes[0]},${bytes[1]},${bytes[2]}`;
        return bytes[3] ? `rgba(${baseColor},0)` : `rgb(${baseColor})`;
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

    /**
     * Нуль-терминированная строка. Нуль терминатор также считывается.
     */
    readCharSeq() {
        const strStart = this.position;
        let size = 0;
        while (this.data[strStart + ++size] !== 0);

        const data = bops.to(this.readBytes(size));
        this.streamPosition += 1;
        return data;
    }

    readBase64(size) {
        return bops.to(this.readBytes(size !== undefined ? size : this.data.length), "base64");
    }

    //Используется в коде ВМ, где количество байт всегда кратно 2
    readStringTrimmed() {
        const size = bops.readInt16LE(this.data, this.streamPosition);

        const strStart = this.streamPosition + 2;
        const preEnd = strStart + size * 2 - 2;
        const strEnd = preEnd + (this.data[preEnd] !== 0);

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
            y: this.readDouble(),
        };
    }

    readIntegerPoint2D() {
        return {
            x: this.readWord(),
            y: this.readWord(),
        };
    }
}
