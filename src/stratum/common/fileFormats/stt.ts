//class.cpp:3623
import { BinaryStream } from "stratum/helpers/binaryStream";
import { FileReadingError, FileSignatureError } from "../errors";
import { EntryCode } from "./entryCode";

export interface VariableSet {
    handle: number;
    classname: string;
    /** `Не используется` */
    classId: number;
    values: { name: string; value: string }[];
    childSets: VariableSet[];
}

function readSubset(stream: BinaryStream): VariableSet {
    const end = stream.readLong();

    const handle = stream.readWord();
    const classname = stream.readString();
    const classId = stream.readLong();

    const values = Array.from({ length: stream.readWord() }, () => ({
        name: stream.readString(),
        value: stream.readString(),
    }));

    const childSets: VariableSet[] = [];

    while (stream.position < end) childSets.push(readSubset(stream));

    return { handle, classname, classId, values, childSets };
}

export function readSttFile(stream: BinaryStream): VariableSet {
    const sign = stream.readWord();
    if (sign !== 0x13) throw new FileSignatureError(stream.filename, sign, 0x13);
    stream.seek(21); //..SC Scheme Variables

    stream.readString(); //имя корневого имиджа
    stream.readWord(); //rr_version
    stream.readWord(); //всегда равно 2

    switch (stream.readWord()) {
        case EntryCode.VR_CLASSES:
            throw new FileReadingError(stream.filename, "Блок VR_CLASSES не реализован.");
        case EntryCode.VR_SETVAR:
            return readSubset(stream);
    }
    return { values: [], childSets: [], handle: 0, classname: "", classId: 0 };
}
