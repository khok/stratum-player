/*
 * Ошибки на все случаи жизни.
 */

import { BinaryStream } from "./binaryStream";

/**
 * Для всех ошибок, связанных с криво считанными из файлов данными или некорректными опциями загрузки проекта.
 *
 */
export class BadDataError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class FileReadingError extends BadDataError {
    constructor(stream: BinaryStream, message: string) {
        super(`Ошибка чтения ${stream.meta.filepathDos || ""}:\n${message}`);
    }
}

export class FileSignatureError extends FileReadingError {
    constructor(stream: BinaryStream, signature: number, expected: number) {
        super(stream, `Сигнатура: 0x${signature.toString(16)}, ожидалось 0x${expected.toString(16)}.`);
    }
}
