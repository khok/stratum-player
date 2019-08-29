import { InternalError } from "../errors";

export default function parseStratumVar(type: string, value: string): string | number {
    switch (type) {
        case "STRING":
            return value;
        case "FLOAT":
            return parseFloat(value) || 0;
        case "HANDLE":
            return (value.startsWith("#") ? parseInt(value.substring(1, value.length)) : parseInt(value)) || 0;
        case "COLORREF":
            return value;
    }
    throw new InternalError(`Неизвестный тип переменной: ${type}`);
}
