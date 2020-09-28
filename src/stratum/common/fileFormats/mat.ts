// import { BinaryStream } from "stratum/helpers/binaryStream";
// import { FileSignatureError } from "stratum/helpers/errors";

// export function readMatrix(stream: BinaryStream) {
//     // const sizeofDouble = 8;
//     const sign = stream.readWord();
//     if (sign !== 0x0c) throw new FileSignatureError(sign, 0x0c);
//     stream.seek(14);
//     const dimY = stream.readLong();
//     const dimX = stream.readLong();
//     const minY = stream.readLong();
//     const minX = stream.readLong();
//     const type = stream.readWord();
//     stream.readWord(); //должен быть 0
//     return { dimX, dimY, data: Array.from({ length: dimX * dimY }, () => stream.readDouble()) };
// }
