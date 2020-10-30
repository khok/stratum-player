type Buffer = Uint8Array;

declare namespace NodeJS {
    export interface ReadableStream {}
}

declare module "stream" {
    export class Duplex {}
}

declare module "zlib" {
    export function createDeflate(): unknown;
}
