/*
 * Правила просты:
 *
 * - если что-то ни в коем случае не должно случиться - нужно выбрасывать обычный Error(). Так можно понять, что в программе баг.
 * - если что-то может случиться, не по вине программы (например, поврежденные файлы, заведомо неправильные вычисления),
 * или же это сделано преднамерено (например, NotImplementedError)
 * то нужно использовать StratumError. А вообще в будущем надо использовать возврат массива ошибок.
 *
 */

//Определяется базовый класс всех ошибок программы.
export class StratumError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class FileSignatureError extends StratumError {
    constructor(signature: number, expected: number) {
        super(`Сигнатура файла: 0x${signature.toString(16)}, ожидалось 0x${expected.toString(16)}`);
    }
}
