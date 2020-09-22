/*
 * Ошибки на все случаи жизни.
 */

export class NotImplementedError extends Error {
    constructor(message: string) {
        super("Не реализовано: " + message);
    }
}

/**
 * Перестраховка от ССЗБ.
 *
 * Появляется в результате неправильно порядка вызова функций или неправильно переданных опций.
 *
 * Если не трогать код и передать все опции, не должно выскакивать никогда.
 */
export class UsageError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Мы передали недостаточно опций.
 */
export class OptionsError extends UsageError {
    constructor(option: string) {
        super(`Отсутствует опция ${option}.`);
    }
}

export class UserLimitError extends UsageError {
    constructor(message: string) {
        super("Ограничения в опциях:\n" + message);
    }
}

/**
 * Для всех ошибок, связанных с криво считанными из файлов данными или некорректными опциями загрузки проекта.
 *
 */
export class BadDataError extends Error {
    constructor(message: string) {
        super(message);
    }
}

// export class NoSuchToolError extends BadDataError {
//     constructor(toolType: string, toolHandle: number, objType: string, objHandle: number) {
//         super(`Инструмент ${toolType} #${toolHandle} не найден для объекта ${objType} #${objHandle}.`);
//     }
// }

export class FileReadingError extends BadDataError {
    constructor(file: string, message: string) {
        super(`Ошибка чтения ${file}:\n${message}`);
    }
}

/**
 * Кидать в случае попытки заюзать асинхронно подгружаемые файлы из виртуальной машины.
 *
 * Будет появляться, если при создании проекта явно не указать имена файлов, которые могут подгружаться в ходе вычисления имиджей.
 *
 * Чтобы избежать, следует в достаточной полноте указать список файлов, которые могут быть подгружены из функций виртуальной машины.
 */
export class AsyncOpenError extends FileReadingError {
    constructor(filename: string) {
        super(filename, `Содержимое файла не было предзагружено.`);
    }
}

export class FileSignatureError extends FileReadingError {
    constructor(file: string, signature: number, expected: number) {
        super(file, `Сигнатура: 0x${signature.toString(16)}, ожидалось 0x${expected.toString(16)}.`);
    }
}
