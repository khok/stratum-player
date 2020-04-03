export default class DataChunk {
    constructor(stream) {
        this.stream = stream;

        this.start = stream.position;
        this.code = stream.readWord();
        if (stream.fileversion < 0x300) return;
        this.size = stream.readLong();
        if (this.size < 0) throw Error("chunk size < 0");
    }

    hasData() {
        return this.size > this.readedBytes();
    }

    readedBytes() {
        return this.stream.position - this.start;
    }

    readNextSubChunk() {
        if (this.start + this.size <= this.stream.position) return 0;
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
