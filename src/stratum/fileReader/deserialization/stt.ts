import { VarSetData } from "data-types-base";
import { FileSignatureError, StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { RecordType } from "./recordType";

function loadSet(stream: BinaryStream): VarSetData {
    const end = stream.readLong();

    const handle = stream.readWord();
    const classname = stream.readString();
    const classId = stream.readLong();

    const varData = Array.from({ length: stream.readWord() }, () => ({
        name: stream.readString(),
        value: stream.readString()
    }));

    const childSets: VarSetData[] = [];

    while (stream.position < end) childSets.push(loadSet(stream));

    return { handle, classname, classId, varData, childSets };
}

//class.cpp::3623
export function readVarSetData(stream: BinaryStream): VarSetData {
    // const sizeofDouble = 8;
    const sign = stream.readWord();
    if (sign !== 0x13) throw new FileSignatureError(sign, 0x13);
    stream.seek(21); //..SC Scheme Variables

    stream.readString(); //название главного класса
    stream.readWord(); //rr_version
    stream.readWord(); //всегда равно 2

    switch (stream.readWord()) {
        case RecordType.VR_CLASSES:
            throw new StratumError("Чтение stt: блок VR_CLASSES не реализован.");
        case RecordType.VR_SETVAR:
            return loadSet(stream);
    }
    return { varData: [], childSets: [], handle: 0, classname: "", classId: 0 };
}
