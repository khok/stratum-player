export class DataChunk {
    constructor(stream) {
        this.stream = stream;
        this.start = stream.pos();

        this.code = stream.int16();
        if (stream.version >= 0x300) {
            this.size = stream.int32();
        }
        if (this.size < 0) throw Error("chunk size < 0");
    }

    hasData() {
        return this.size > this.readedBytes();
    }

    readedBytes() {
        return this.stream.pos() - this.start;
    }

    readNextSubChunk() {
        if (this.start + this.size <= this.stream.pos()) return 0;
        return new DataChunk(this.stream);
    }

    goEnd() {
        this.stream.seek(this.start + this.size);
    }

    checkReaded() {
        const bytes = this.readedBytes();
        if (bytes > this.size) throw Error(`Chunk data out of range: ${bytes} instead of ${this.size}`);
        if (bytes < this.size) throw Error(`Chunk not readed: ${bytes} instead of ${this.size}`);
    }
}
