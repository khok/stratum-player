import { BinaryStream, parseStratumVar, StratumClassInfo, StratumVarInfo } from ".";
import { StratumError } from "../errors";
import RecordType from "./recordType";

type StratumVarSet = Readonly<{
    // handle: number;
    // className: string; //бесполезная информация
    // classId: number; //еще бесполезнее
    varData: readonly Readonly<{ name: string; value: number | string }>[];
    childs: { handle: number; set: StratumVarSet }[];
}>;

function getVarIdByName(vars: readonly StratumVarInfo[], name: string) {
    name = name.toLowerCase();
    return vars.findIndex(({ name: n }) => n.toLowerCase() === name);
}

//Лучше бы тут все переписать, но мне пока пох
//
function loadVarSet(stream: BinaryStream, collection: Map<string, StratumClassInfo>) {
    const end = stream.readLong();

    const handle = stream.readWord();

    const set: any = {
        className: stream.readString(), //бесполезная информация,
        classId: stream.readLong() //    но считать надо
    };

    const varData = Array.from({ length: stream.readWord() }, () => ({
        name: stream.readString(),
        data: stream.readString()
    }));

    const classInfo = collection.get(set.className);
    if (!classInfo) {
        console.warn(`Объект ${set.className} #${handle} не существует, но для него присвоены переменные`);
        return { handle, set: <StratumVarSet>set };
    }
    const { vars } = classInfo;
    if (!vars && varData.length != 0) throw new StratumError(`Класс ${set.className} не имеет переменных`);

    set.varData = vars
        ? varData.map(({ name, data }) => {
              const idx = getVarIdByName(vars, name);
              if (idx < 0) throw new StratumError(`Переменная ${name} не найдена`);
              return {
                  name,
                  value: parseStratumVar(vars[idx].type, data)
              };
          })
        : [];

    delete set.className; //считали - удалили
    delete set.classId;

    const childs: { handle: number; set: StratumVarSet }[] = [];

    while (stream.position < end) {
        childs.push(loadVarSet(stream, collection));
        delete set.handle;
    }
    set.childs = childs;

    return { handle, set: <StratumVarSet>set };
}

//class.cpp::3623
function readStratumVars(stream: BinaryStream, collection: Map<string, StratumClassInfo>): StratumVarSet {
    // const sizeofDouble = 8;
    if (stream.readWord() !== 0x13) throw Error("Not a Stratum Scheme Variables File");
    stream.seek(21); //..SC Scheme Variables

    const mainClass = stream.readString();
    stream.readWord(); //rr_version
    stream.readWord(); //всегда равно 2

    const res: { mainClass: string; varSet?: StratumVarSet } = {
        mainClass
    };

    if (!collection.get(mainClass)) throw new StratumError(`Главный класс ${mainClass} не найден`);

    let next = stream.readWord();
    if (next == RecordType.VR_CLASSES) {
        throw Error("Not implemented yet");
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
        return loadVarSet(stream, collection).set;
        // res.varSet = loadVarSet(stream, collection);
        next = stream.readWord();
    }

    return { varData: [], childs: [] };
    // if (next !== 0) throw "Someting wrong here";
    // return res;
}

export { StratumVarSet, readStratumVars };
