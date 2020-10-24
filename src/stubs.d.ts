declare global {
    type Buffer = Uint8Array;
    namespace NodeJS {
        export interface ReadableStream {}
    }
}

export class Duplex {}
export function createDeflate(): unknown;
