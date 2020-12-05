//class.cpp:3623
import { BinaryStream, FileReadingError, FileSignatureError } from "stratum/helpers/binaryStream";
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
    const end = stream.int32();

    const handle = stream.uint16();
    const classname = stream.string();
    const classId = stream.int32();

    const values = Array.from({ length: stream.uint16() }, () => ({
        name: stream.string(),
        value: stream.string(),
    }));

    const childSets: VariableSet[] = [];

    while (stream.position < end) childSets.push(readSubset(stream));

    return { handle, classname, classId, values, childSets };
}

export function readSttFile(stream: BinaryStream): VariableSet {
    const sign = stream.uint16();
    if (sign !== 0x13) throw new FileSignatureError(stream, sign, 0x13);
    stream.seek(21); //..SC Scheme Variables

    stream.string(); //имя корневого имиджа
    stream.uint16(); //rr_version
    stream.uint16(); //всегда равно 2

    switch (stream.uint16()) {
        case EntryCode.VR_CLASSES:
            throw new FileReadingError(stream, "Блок VR_CLASSES не реализован.");
        case EntryCode.VR_SETVAR:
            return readSubset(stream);
    }
    return { values: [], childSets: [], handle: 0, classname: "", classId: 0 };
}
