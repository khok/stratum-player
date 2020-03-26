import { BinaryStream } from "~/helpers/binaryStream";
import { BmpImage } from "data-types-graphics";

export function readBitmap(stream: BinaryStream): BmpImage;
export function readDoubleBitmap(stream: BinaryStream): BmpImage;
