import { NumBool } from "stratum/common/types";
import { decode, encode } from "stratum/helpers/win1251";
import { ReadWriteFile } from "stratum/stratum";

export interface FlushCallback {
    (data: ArrayBuffer): boolean | Promise<boolean>;
}

export interface EnvStreamArgs {
    data?: ArrayBuffer | ArrayBufferView;
    file?: ReadWriteFile;
}

export class EnvStream {
    private static slashR = "\r".charCodeAt(0);
    private static slashN = "\n".charCodeAt(0);

    private static widthTable: number[] = [1, 1, 2, 2, 4, 4, 4, 5, 8, 10];
    private static widthToSize(width: number) {
        if (width < 0 || width > 9) return 0;
        return EnvStream.widthTable[width];
    }

    private v: DataView;
    private p: number;

    private onflush: ReadWriteFile | null;
    private width: number;

    constructor(args: EnvStreamArgs = {}) {
        const b = args.data;
        if (!b) {
            this.v = new DataView(new ArrayBuffer(0));
        } else if (b instanceof ArrayBuffer) {
            this.v = new DataView(b.slice(0));
        } else {
            this.v = new DataView(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
        }
        this.p = 0;
        this.width = 8;
        this.onflush = args.file ?? null;
    }

    copyTo(target: EnvStream, from: number, length: number): NumBool {
        if (from < 0 || from + length > this.v.byteLength) return 0;

        if (target.v.byteLength < length) {
            target.v = new DataView(this.v.buffer.slice(from, length));
        } else {
            new Uint8Array(target.v.buffer).set(new Uint8Array(this.v.buffer, from, length));
        }
        return 1;
    }

    seek(pos: number): number {
        return (this.p = pos);
    }

    eof(): NumBool {
        return this.p >= this.size() ? 1 : 0;
    }

    pos(): number {
        return this.p;
    }
    size(): number {
        return this.v.byteLength;
    }

    setWidth(w: number): NumBool {
        this.width = w;
        return 1;
    }

    widthNumber(): number {
        const s = EnvStream.widthToSize(this.width);
        if (s === 0) return 0;

        const pos = this.p;
        const end = pos + s;
        if (end > this.size()) return 0;
        this.p = end;

        switch (this.width) {
            case 0:
                return this.v.getUint8(pos);
            case 1:
                return this.v.getInt8(pos);
            case 2:
                return this.v.getUint16(pos, true);
            case 3:
                return this.v.getInt16(pos, true);
            case 4:
                return this.v.getUint32(pos, true);
            case 5:
                return this.v.getInt32(pos, true);
            case 6:
                return this.v.getFloat32(pos, true);
            case 7:
                throw Error("Чтение FLOAT40 не поддерживается");
            case 8:
                return this.v.getFloat64(pos, true);
            case 9:
                throw Error("Чтение FLOAT80 не поддерживается");
            default:
                return 0;
        }
    }

    resize(size: number): void {
        const a = new Uint8Array(new ArrayBuffer(size));
        a.set(new Uint8Array(this.v.buffer));
        this.v = new DataView(a.buffer);
    }

    writeWidthNumber(val: number): number {
        const s = EnvStream.widthToSize(this.width);
        if (s === 0) return 0;

        const pos = this.p;
        const end = pos + s;
        if (end > this.size()) this.resize(end);
        this.p = end;

        switch (this.width) {
            case 0:
                this.v.setUint8(pos, val);
                return 1;
            case 1:
                this.v.setInt8(pos, val);
                return 1;
            case 2:
                this.v.setUint16(pos, val, true);
                return 2;
            case 3:
                this.v.setInt16(pos, val, true);
                return 2;
            case 4:
                this.v.setUint32(pos, val, true);
                return 4;
            case 5:
                this.v.setInt32(pos, val, true);
                return 4;
            case 6:
                this.v.setFloat32(pos, val, true);
                return 4;
            case 7:
                throw Error("FLOAT40 не поддерживается");
            case 8:
                this.v.setFloat64(pos, val, true);
                return 8;
            case 9:
                throw Error("FLOAT80 не поддерживается");
            default:
                return 0;
        }
    }

    text(): string {
        return decode(new Uint8Array(this.v.buffer));
    }

    line(): string {
        const pos = this.p;
        const maxLen = this.size() - pos;
        if (maxLen <= 0) return "";

        let size = 0;
        let end = 0;
        while (size < maxLen) {
            const b = this.v.getUint8(pos + size);
            if (b === 0) {
                end = 1;
                break;
            }
            if (b === EnvStream.slashR && size + 1 < maxLen && this.v.getInt8(pos + size + 1) === EnvStream.slashN) {
                end = 2;
                break;
            }
            size += 1;
        }
        const s = decode(new Uint8Array(this.v.buffer, pos, size));
        this.p = pos + size + end;
        return s;
    }

    writeLine(val: string): number {
        const realVal = val + "\r\n";
        let pos = this.p;
        const end = pos + realVal.length;
        if (end > this.size()) this.resize(end);
        this.p = end;

        const result = encode(realVal);
        for (let i = 0; i < result.length; ++i) {
            this.v.setUint8(pos, result[i]);
            pos += 1;
        }

        return realVal.length;
    }

    close(): boolean | Promise<boolean> {
        if (this.onflush) return this.onflush.write(this.v.buffer);
        return true;
    }
}
