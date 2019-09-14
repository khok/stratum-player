import { VectorDrawData } from "../../../graphics/types";
import { BinaryStream } from "../../binaryStream";

export function readVectorDrawData(stream: BinaryStream): { __vdr: any; vdr: VectorDrawData };
