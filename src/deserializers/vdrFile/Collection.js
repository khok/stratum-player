import DataChunk from './DataChunk'
import consts from './consts'
import { itemReaders, headerReaders } from './CollectionData'

export function readNext(stream, _mustBeCollection, objectCode) {
    const chunk = new DataChunk(stream);

    if(chunk.code === 0)
        throw Error('Chunk not an object or collection');

    if((objectCode !== undefined) && (objectCode !== chunk.code))
        throw Error(`Chunk code is ${chunk.code} instead of ${objectCode}`);

    const isCollection = (chunk.code > 999 && chunk.code < 1200);

    if(_mustBeCollection && !isCollection)
        throw Error('not a collection: ' + chunk.code);

    const name = Object.keys(consts).find(key => consts[key] === chunk.code);
    if(name === undefined)
        throw Error(`Unknown ${isCollection ? 'collection' : 'object'}: ${chunk.code}`);

    const data = (isCollection ? readAsCollection : readAsCollectionItem)(stream, name);

    if(stream.fileversion < 0x300)
        return Array.isArray(data) ? {type: name, data} : {type: name, ...data};

    // Поможет отловить ошибку с постчанком
    // console.log('Считал (' + chunk.code + ") " + Object.keys(consts).find(key => consts[key] === chunk.code));

    while(chunk.hasData()){
        const _lastChunk = new DataChunk(stream);

        switch(_lastChunk.code) {
            case consts.otDATAITEMS:
                readAsCollection(stream, 'otDATAITEMS'); //data.dataitems - какой то мусор
                break;
            case consts.stOBJNAME:
                data.name = stream.readFixedString(_lastChunk.size - _lastChunk.readedBytes());
                break;
            default:
                throw Error('Unknown postchunk: ' + _lastChunk.code);
        }
    }
    //Раскоментить если начнет вылетать здесь
    // if(chunk.readedBytes() !== chunk.size){
    //     const name = Object.keys(consts).find(key => consts[key] === chunk.code);
    //     console.log(`Хрень: ${name}, ${isCollection} (${consts[name]}): ${chunk.readedBytes()} из ${chunk.size}`);
    //     console.log(data);
    //     console.log(stream.readBytes(chunk.size - chunk.readedBytes()));
    // }
    chunk.checkReaded();
    return Array.isArray(data) ? {type: name, data} : {type: name, ...data};
}

export function readAsCollection(stream, name) {

    const itemCount = stream.readWord();
    const limit = stream.readWord();
    const delta = stream.readWord();

    const headerReader = headerReaders[name];
    if(!headerReader)
        throw Error('No get item function for ' + name);

    //Читаем заголовок коллекции и получаем функцию для итерации по элементам
    const getItemFunc = headerReader(stream) || readNext;

    let items = [];
    for(let i = 0; i < itemCount; i++) {
        const item = getItemFunc(stream);
        items.push(item);
    }
    return items;
}

export function readAsCollectionItem(stream, name) {

    const readItem = itemReaders[name];
    if(!readItem)
        throw Error('No item function for ' + name);
    return readItem(stream);
}
