// import { BinaryStream } from "stratum/helpers/binaryStream";
// import { FileSignatureError } from "stratum/helpers/errors";

// export function readMatrix(stream: BinaryStream) {
//     // const sizeofDouble = 8;
//     const sign = stream.uint16();
//     if (sign !== 0x0c) throw new FileSignatureError(sign, 0x0c);
//     stream.seek(14);
//     const dimY = stream.int32();
//     const dimX = stream.int32();
//     const minY = stream.int32();
//     const minX = stream.int32();
//     const type = stream.uint16();
//     stream.uint16(); //должен быть 0
//     return { dimX, dimY, data: Array.from({ length: dimX * dimY }, () => stream.float64()) };
// }
