//Функции считывают заголовки коллекций
//и возвращают итератор для чтения элементов коллекции
//если ничего не возвращают - используется дефолтный итератор элементов
//(см Collection.js:67)

function readSortedCollectionGarbage(stream) {
    stream.readBytes(1); //dup
}

function readHandleCollectionGarbage(stream) {
    readSortedCollectionGarbage(stream);
    stream.readWord(); //current
}

function readPrimaryItem(stream) {
    return stream.readWord();
}

function readDataItem(stream) {
    const id = stream.readWord();
    const size = stream.readWord();
    const data = stream.readBytes(size);
    return { id, size, data };
}

function readLogTextItem(stream) {
    return {
        ltFgColor: stream.readLong(),
        ltBgColor: stream.readLong(),
        fontHandle: stream.readWord(),
        stringHandle: stream.readWord(),
    };
}

function read_HandleCollectionHeader(stream) {
    readHandleCollectionGarbage(stream);
}

function read_otPRIMARYCOLLECTION() {
    return readPrimaryItem;
}

function read_otDATAITEMS(stream) {
    readSortedCollectionGarbage(stream);
    return readDataItem;
}

function read_otLOGTEXTCOLLECTION() {
    return readLogTextItem;
}

export default function init(funcs) {
    funcs.otPRIMARYCOLLECTION = read_otPRIMARYCOLLECTION;
    funcs.otDATAITEMS = read_otDATAITEMS;

    funcs.otOBJECTCOLLECTION = read_HandleCollectionHeader;
    funcs.otPENCOLLECTION = read_HandleCollectionHeader;
    funcs.otBRUSHCOLLECTION = read_HandleCollectionHeader;
    funcs.otDOUBLEDIBCOLLECTION = read_HandleCollectionHeader;
    funcs.otFONTCOLLECTION = read_HandleCollectionHeader;
    funcs.otSTRINGCOLLECTION = read_HandleCollectionHeader;
    funcs.otTEXTCOLLECTION = read_HandleCollectionHeader;
    funcs.otDIBCOLLECTION = read_HandleCollectionHeader;
    funcs.otLOGTEXTCOLLECTION = read_otLOGTEXTCOLLECTION;
}
