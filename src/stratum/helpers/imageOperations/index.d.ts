import { BinaryStream } from "~/helpers/binaryStream";
import { BmpImage } from "data-types-graphics";

export function readBitmap(stream: BinaryStream): { image: BmpImage; width: number; height: number };
export function readDoubleBitmap(stream: BinaryStream): { image: BmpImage; width: number; height: number };
