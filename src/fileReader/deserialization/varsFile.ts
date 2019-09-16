import { StratumError, FileSignatureError, NotImplementedError } from "../../errors";
import { ClassData, VarData, VarSet } from "../../types";
import { BinaryStream } from "../binaryStream";
import { parseVarValue } from "./parseVarValue";
import { RecordType } from "./recordType";

function getVarIdByName(vars: VarData[], name: string) {
    name = name.toLowerCase();
    return vars.findIndex(({ name: n }) => n.toLowerCase() === name);
}

//Лучше бы тут все переписать, но мне пока пох
//
function loadVarSet(stream: BinaryStream, collection: Map<string, ClassData>) {
    const end = stream.readLong();

    const set: any = {
        handle: stream.readWord(),
        className: stream.readString(),
        classId: stream.readLong() //    но считать надо
    };

    const varData = Array.from({ length: stream.readWord() }, () => ({
        name: stream.readString(),
        data: stream.readString()
    }));

    const classInfo = collection.get(set.className);
    if (!classInfo) {
        console.warn(`Объект ${set.className} #${set.handle} не существует, но для него присвоены переменные`);
        return <VarSet>set;
    }
    const { vars } = classInfo;
    if (!vars && varData.length != 0) throw new StratumError(`Класс ${set.className} не имеет переменных`);

    set.varData = vars
        ? varData.map(({ name, data }) => {
              const idx = getVarIdByName(vars, name);
              if (idx < 0) throw new StratumError(`Переменная ${name} не найдена`);
              return {
                  name,
                  value: parseVarValue(vars[idx].type, data)
              };
          })
        : [];

    // delete set.className;
    delete set.classId; //считали - удалили

    const childs: VarSet[] = [];

    while (stream.position < end) {
        childs.push(loadVarSet(stream, collection));
        // delete set.handle;
    }
    set.childs = childs;

    return <VarSet>set;
}

//class.cpp::3623
export function readVarSet(stream: BinaryStream, collection: Map<string, ClassData>): VarSet {
    // const sizeofDouble = 8;
    const sign = stream.readWord();
    if (sign !== 0x13) throw new FileSignatureError(sign, 0x13);
    stream.seek(21); //..SC Scheme Variables

    const mainClass = stream.readString();
    stream.readWord(); //rr_version
    stream.readWord(); //всегда равно 2

    const res: { mainClass: string; varSet?: VarSet } = {
        mainClass
    };

    if (!collection.get(mainClass)) throw new StratumError(`Главный класс ${mainClass} не найден`);

    let next = stream.readWord();
    if (next == RecordType.VR_CLASSES) {
        throw new NotImplementedError("Чтение stt: блок VR_CLASSES не реализован.");
        // const itemCount = stream.readWord();

        // for(let i = 0; i < itemCount; i++){
        //     const name = stream.readString();
        //     const _classid = stream.readLong();
        //     const varcount = stream.readWord();
        //     const childcount = stream.readWord();
        //     const varsize = stream.readWord();

        //     const childs = [];

        //     for(let j = 0; j < childcount; j++){
        //         childs.push({
        //             handle: stream.readWord(),
        //             classIndex: stream.readWord()
        //         });
        //     }

        //     const vars = [];

        //     for(let j = 0; j < varcount; j++){
        //         vars.push({
        //             name: stream.readString(),
        //             classIndex: stream.readWord()
        //         });
        //     }

        //     if(stream.readWord() !== RecordType.VR_VARS)
        //         throw 'Something wrong in vars';

        //     throw 'OK';
        // };

        // next = stream.readWord();
    }

    //class.cpp::5165
    if (next == RecordType.VR_SETVAR) {
        return loadVarSet(stream, collection);
        // res.varSet = loadVarSet(stream, collection);
        // next = stream.readWord();
    }

    return { varData: [], childs: [], handle: 0, className: "" };
    // if (next !== 0) throw "Someting wrong here";
    // return res;
}
