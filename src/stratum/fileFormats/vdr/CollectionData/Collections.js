//Функции считывают заголовки коллекций
//и возвращают итератор для чтения элементов коллекции
//если ничего не возвращают - используется дефолтный итератор элементов
//(см Collection.js:67)

function readSortedCollectionGarbage(stream) {
    stream.bytes(1); //duplicates
}

function readHandleCollectionGarbage(stream) {
    readSortedCollectionGarbage(stream);
    stream.uint16(); //current
}

function readPrimaryItem(stream) {
    return stream.uint16();
}

function readDataItem(stream) {
    const id = stream.uint16();
    const size = stream.uint16();
    const data = stream.bytes(size);
    return { id, size, data };
}

function readLogTextItem(stream) {
    return {
        fgColor: stream.int32(),
        bgColor: stream.int32(),
        fontHandle: stream.uint16(),
        stringHandle: stream.uint16(),
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

export function initCollections(funcs) {
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
