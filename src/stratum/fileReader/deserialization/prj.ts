import { FileSignatureError, StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { RecordType } from "./recordType";

export function readProjectName(stream: BinaryStream) {
    const sign = stream.readWord();
    if (sign !== 0x6849) throw new FileSignatureError(sign, 0x6849);

    let next = stream.readWord();
    if (next === RecordType.PR_VARS) {
        const count = stream.readWord();
        for (let i = 0; i < count; i++) {
            const size = stream.readWord();
            stream.seek(stream.position + size);
            // const full = stream.getPosition() + size;

            // const scmByte = stream.readBytes(1)[0];
            // console.log(scmByte);
            // const scmSize = stream.readBytes(1)[0];

            // const name = stream.readCharSeq();
            // const specByte = stream.readBytes(1)[0];
            // const data = stream.readCharSeq();

            // console.log(name, scmSize, data);

            // console.log(stream.readFixedString(full - stream.getPosition()));
        }
        next = stream.readWord();
    }
    if (next !== RecordType.PR_MAINCLASS) throw new StratumError("Ошибка в чтении .prj файла");

    //Считывает название главного класса;
    return stream.readString();
    /* Здесь чтение еще не закончено */
}
