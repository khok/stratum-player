import { NumBool } from ".";

export interface NeoMatrixArgs {
    minX: number;
    minY: number;
    rows: number;
    cols: number;
    data?: number[];
}

export class NeoMatrix {
    private minX: number;
    private minY: number;
    private cols: number;
    private rows: number;
    private data: Float64Array;

    constructor(args: NeoMatrixArgs) {
        this.minX = args.minX;
        this.minY = args.minY;
        this.rows = args.rows;
        this.cols = args.cols;

        this.data = args.data ? new Float64Array(args.data) : new Float64Array(this.rows * this.cols);
    }

    get(i: number, j: number): number {
        const r = i - this.minX;
        const c = j - this.minY;
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return 0;
        return this.data[r * this.cols + c];
    }

    set(i: number, j: number, val: number): number {
        const r = i - this.minX;
        const c = j - this.minY;
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return 0;
        this.data[r * this.cols + c] = val;
        return val;
    }

    fill(value: number): NumBool {
        this.data.fill(value);
        return 1;
    }
}
// FLOAT MLoad(FLOAT Q, STRING FileName, FLOAT Flag)
