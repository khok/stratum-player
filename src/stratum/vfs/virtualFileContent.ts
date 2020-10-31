export type LazyBuffer =
    | {
          async(type: "arraybuffer"): Promise<ArrayBuffer>;
      }
    | ArrayBuffer;

export class VirtualFileContent {
    constructor(private src: LazyBuffer) {}

    async open(): Promise<ArrayBuffer> {
        if (!(this.src instanceof ArrayBuffer)) this.src = await this.src.async("arraybuffer");
        return this.src;
    }

    openSync(): ArrayBuffer | undefined {
        return this.src instanceof ArrayBuffer ? this.src : undefined;
    }
}
