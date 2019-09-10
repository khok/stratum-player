export default class BinaryStream {
    constructor(data: Uint8Array | ArrayBuffer);

    EOF(): boolean;

    seek(pos: number): void;

    readonly position: number;

    readBytes(size: number): Uint8Array;

    readWord(): number;

    readLong(): number;

    readColor(): string;

    readUint(): number;

    readDouble(): number;

    readCharSeq(): string;

    readBase64(size: number): string;

    readStringTrimmed(): string;

    readFixedString(size: number): string;

    readString(): string;

    readPoint2D(): { x: number; y: number };

    readIntegerPoint2D(): { x: number; y: number };
}
