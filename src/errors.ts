//Определяется базовый класс всех ошибок программы.
export class StratumError extends Error {
    constructor(message : string) {
        super(message);
    }
}

export class NotImplementedError extends StratumError {
    constructor(message : string) {
        super(message);
    }
}

export class FileSignatureError extends StratumError {
    constructor(signature : number, expected : number) {
        super(`Сигнатура файла: 0x${signature.toString(16)}, ожидалось 0x${expected.toString(16)}`);
    }
}

export class FileReadingError extends StratumError {
    constructor(fileName : string, message : string) {
        super(`Ошибка чтения файла ${fileName} : ${message}`);
    }
}

//Ошибки этого типа ни в коем случае не должны выскакивать.
//Если она вылетает значит программа работает неправильно,
//и внешние файлы тут не при чем.
export class InternalError extends StratumError {
    constructor(message : string) {
        super(message);
    }
}
