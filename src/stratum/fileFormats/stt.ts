//class.cpp:3623
import { BinaryReader, FileReadingError, FileSignatureError } from "stratum/helpers/binaryReader";
import { EntryCode } from "./entryCode";

export interface VariableSet {
    handle: number;
    classname: string;
    /** `Не используется` */
    classId: number;
    values: { name: string; value: string }[];
    childSets: VariableSet[];
}

function readSubset(reader: BinaryReader): VariableSet {
    const end = reader.int32();

    const handle = reader.uint16();
    const classname = reader.string();
    const classId = reader.int32();

    const values = Array.from({ length: reader.uint16() }, () => ({
        name: reader.string(),
        value: reader.string(),
    }));

    const childSets: VariableSet[] = [];

    while (reader.pos() < end) childSets.push(readSubset(reader));

    return { handle, classname, classId, values, childSets };
}

export function readSttFile(reader: BinaryReader): VariableSet {
    const sign = reader.uint16();
    if (sign !== 0x13) throw new FileSignatureError(reader, sign, 0x13);
    reader.seek(21); //..SC Scheme Variables

    reader.string(); //имя корневого имиджа
    reader.uint16(); //rr_version
    reader.uint16(); //всегда равно 2

    switch (reader.uint16()) {
        case EntryCode.VR_CLASSES:
            throw new FileReadingError(reader, "Блок VR_CLASSES не реализован.");
        case EntryCode.VR_SETVAR:
            return readSubset(reader);
    }
    return { values: [], childSets: [], handle: 0, classname: "", classId: 0 };
}
