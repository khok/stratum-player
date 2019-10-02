import { FileSignatureError, StratumError } from "../../errors";
import { VarSet } from "../../core/types";
import { BinaryStream } from "../binaryStream";
import { RecordType } from "./recordType";

function loadVarSet(stream: BinaryStream): VarSet {
    const end = stream.readLong();

    const handle = stream.readWord();
    const classname = stream.readString();
    stream.readLong(); // classId

    const varData = Array.from({ length: stream.readWord() }, () => ({
        name: stream.readString(),
        data: stream.readString()
    }));

    const childSets: VarSet[] = [];

    while (stream.position < end) childSets.push(loadVarSet(stream));

    return {
        handle,
        classname,
        varData,
        childSets
    };
}

//class.cpp::3623
export function readVarSet(stream: BinaryStream): VarSet {
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
            return loadVarSet(stream);
    }
    return { varData: [], childSets: [], handle: 0, classname: "" };
}
