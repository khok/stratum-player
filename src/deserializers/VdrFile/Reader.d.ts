import { BinaryStream, StratumImage, StratumScheme } from "..";

export default function readStratumVectorDraw(
    stream: BinaryStream
): { originalScheme: any; scheme: StratumScheme | StratumImage };
