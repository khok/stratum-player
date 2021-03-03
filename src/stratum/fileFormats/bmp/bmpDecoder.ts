/*
The MIT License (MIT)

Copyright (c) 2014 @丝刀口

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

class BmpDecoder {
    private data: Uint8ClampedArray;
    width: number = 0;
    height: number = 0;

    bitPP: number = 0;
    pos: number;
    view: DataView;
    is_with_alpha: boolean;
    bottom_up: boolean;
    flag: string;

    maskRed: number = 0;
    maskGreen: number = 0;
    maskBlue: number = 0;
    mask0: number = 0;

    fileSize: number = 0;
    reserved: number = 0;
    offset: number = 0;
    headerSize: number = 0;
    planes: number = 0;
    compress: number = 0;
    rawSize: number = 0;
    hr: number = 0;
    vr: number = 0;
    colors: number = 0;
    importantColors: number = 0;

    palette!: Array<{
        red: number;
        green: number;
        blue: number;
        quad: number;
    }>;

    constructor(view: DataView, data: Uint8ClampedArray, is_with_alpha = false, offset = 0) {
        this.data = data;
        this.pos = offset;
        this.view = view;
        this.is_with_alpha = !!is_with_alpha;
        this.bottom_up = true;
        // this.flag = new TextDecoder().decode(new Uint8ClampedArray(view.buffer, view.byteOffset, 2));
        this.flag = "BM";
        this.pos += 2;
        // if (this.flag !== "BM") throw new Error("Invalid BMP File");
        this.parseHeader();
        this.parseRGBA();
    }

    parseHeader() {
        this.fileSize = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.reserved = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.offset = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.headerSize = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.width = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.height = this.view.getInt32(this.pos, true);
        this.pos += 4;
        this.planes = this.view.getUint16(this.pos, true);
        this.pos += 2;
        this.bitPP = this.view.getUint16(this.pos, true);
        this.pos += 2;
        this.compress = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.rawSize = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.hr = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.vr = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.colors = this.view.getUint32(this.pos, true);
        this.pos += 4;
        this.importantColors = this.view.getUint32(this.pos, true);
        this.pos += 4;

        if (this.bitPP === 16 && this.is_with_alpha) {
            this.bitPP = 15;
        }
        if (this.bitPP < 15) {
            const len = this.colors === 0 ? 1 << this.bitPP : this.colors;
            this.palette = new Array(len);
            for (let i = 0; i < len; i++) {
                const blue = this.view.getUint8(this.pos++);
                const green = this.view.getUint8(this.pos++);
                const red = this.view.getUint8(this.pos++);
                const quad = this.view.getUint8(this.pos++);
                this.palette[i] = {
                    red,
                    green,
                    blue,
                    quad,
                };
            }
        }
        if (this.height < 0) {
            this.height *= -1;
            this.bottom_up = false;
        }
    }

    parseRGBA() {
        const bitn = "bit" + this.bitPP;
        const len = this.width * this.height * 4;
        if (this.data.length !== len) throw Error("Error reading BMP file");
        if (bitn !== "bit1" && bitn !== "bit4" && bitn !== "bit8" && bitn !== "bit15" && bitn !== "bit16" && bitn !== "bit24" && bitn !== "bit32")
            throw new Error("Unknown bit: " + bitn);
        this[bitn]();
    }

    bit1() {
        const xlen = Math.ceil(this.width / 8);
        const mode = xlen % 4;
        let y = this.height >= 0 ? this.height - 1 : -this.height;
        for (y = this.height - 1; y >= 0; y--) {
            const line = this.bottom_up ? y : this.height - 1 - y;
            for (let x = 0; x < xlen; x++) {
                const b = this.view.getUint8(this.pos++);
                const location = line * this.width * 4 + x * 8 * 4;
                for (let i = 0; i < 8; i++) {
                    if (x * 8 + i < this.width) {
                        const rgb = this.palette[(b >> (7 - i)) & 0x1];

                        this.data[location + i * 4] = rgb.red;
                        this.data[location + i * 4 + 1] = rgb.green;
                        this.data[location + i * 4 + 2] = rgb.blue;
                        this.data[location + i * 4 + 3] = 255;
                    } else {
                        break;
                    }
                }
            }

            if (mode !== 0) {
                this.pos += 4 - mode;
            }
        }
    }

    bit4() {
        //RLE-4
        if (this.compress === 2) {
            this.data.fill(0xff);

            let location = 0;
            let lines = this.bottom_up ? this.height - 1 : 0;
            let low_nibble = false; //for all count of pixel

            const setPixelData = (rgbIndex: number) => {
                const rgb = this.palette[rgbIndex];
                this.data[location] = rgb.red;
                this.data[location + 1] = rgb.green;
                this.data[location + 2] = rgb.blue;
                this.data[location + 3] = 255;
                location += 4;
            };

            while (location < this.data.length) {
                const a = this.view.getUint8(this.pos++);
                const b = this.view.getUint8(this.pos++);
                //absolute mode
                if (a === 0) {
                    if (b === 0) {
                        //line end
                        if (this.bottom_up) {
                            lines--;
                        } else {
                            lines++;
                        }
                        location = lines * this.width * 4;
                        low_nibble = false;
                        continue;
                    } else if (b === 1) {
                        //image end
                        break;
                    } else if (b === 2) {
                        //offset x,y
                        const x = this.view.getUint8(this.pos++);
                        const y = this.view.getUint8(this.pos++);
                        if (this.bottom_up) {
                            lines -= y;
                        } else {
                            lines += y;
                        }

                        location += y * this.width * 4 + x * 4;
                    } else {
                        let c = this.view.getUint8(this.pos++);
                        for (let i = 0; i < b; i++) {
                            if (low_nibble) {
                                setPixelData.call(this, c & 0x0f);
                            } else {
                                setPixelData.call(this, (c & 0xf0) >> 4);
                            }

                            if (i & 1 && i + 1 < b) {
                                c = this.view.getUint8(this.pos++);
                            }

                            low_nibble = !low_nibble;
                        }

                        if ((((b + 1) >> 1) & 1) === 1) {
                            this.pos++;
                        }
                    }
                } else {
                    //encoded mode
                    for (let i = 0; i < a; i++) {
                        if (low_nibble) {
                            setPixelData.call(this, b & 0x0f);
                        } else {
                            setPixelData.call(this, (b & 0xf0) >> 4);
                        }
                        low_nibble = !low_nibble;
                    }
                }
            }
        } else {
            const xlen = Math.ceil(this.width / 2);
            const mode = xlen % 4;
            for (let y = this.height - 1; y >= 0; y--) {
                const line = this.bottom_up ? y : this.height - 1 - y;
                for (let x = 0; x < xlen; x++) {
                    const b = this.view.getUint8(this.pos++);
                    const location = line * this.width * 4 + x * 2 * 4;

                    const before = b >> 4;
                    const after = b & 0x0f;

                    let rgb = this.palette[before];
                    this.data[location] = rgb.red;
                    this.data[location + 1] = rgb.green;
                    this.data[location + 2] = rgb.blue;
                    this.data[location + 3] = 255;

                    if (x * 2 + 1 >= this.width) break;

                    rgb = this.palette[after];

                    this.data[location + 4] = rgb.red;
                    this.data[location + 4 + 1] = rgb.green;
                    this.data[location + 4 + 2] = rgb.blue;
                    this.data[location + 4 + 3] = 255;
                }

                if (mode !== 0) {
                    this.pos += 4 - mode;
                }
            }
        }
    }

    bit8() {
        //RLE-8
        if (this.compress === 1) {
            this.data.fill(0xff);

            let location = 0;
            let lines = this.bottom_up ? this.height - 1 : 0;

            const setPixelData = (rgbIndex: number) => {
                const rgb = this.palette[rgbIndex];
                this.data[location] = rgb.red;
                this.data[location + 1] = rgb.green;
                this.data[location + 2] = rgb.blue;
                this.data[location + 3] = 255;
                location += 4;
            };

            while (location < this.data.length) {
                const a = this.view.getUint8(this.pos++);
                const b = this.view.getUint8(this.pos++);
                //absolute mode
                if (a === 0) {
                    if (b === 0) {
                        //line end
                        if (this.bottom_up) {
                            lines--;
                        } else {
                            lines++;
                        }
                        location = lines * this.width * 4;
                        continue;
                    } else if (b === 1) {
                        //image end
                        break;
                    } else if (b === 2) {
                        //offset x,y
                        const x = this.view.getUint8(this.pos++);
                        const y = this.view.getUint8(this.pos++);
                        if (this.bottom_up) {
                            lines -= y;
                        } else {
                            lines += y;
                        }

                        location += y * this.width * 4 + x * 4;
                    } else {
                        for (let i = 0; i < b; i++) {
                            const c = this.view.getUint8(this.pos++);
                            setPixelData.call(this, c);
                        }
                        if ((b & 1) === 1) {
                            this.pos++;
                        }
                    }
                } else {
                    //encoded mode
                    for (let i = 0; i < a; i++) {
                        setPixelData.call(this, b);
                    }
                }
            }
        } else {
            const mode = this.width % 4;
            for (let y = this.height - 1; y >= 0; y--) {
                const line = this.bottom_up ? y : this.height - 1 - y;
                for (let x = 0; x < this.width; x++) {
                    const b = this.view.getUint8(this.pos++);
                    const location = line * this.width * 4 + x * 4;
                    if (b < this.palette.length) {
                        const rgb = this.palette[b];

                        this.data[location] = rgb.red;
                        this.data[location + 1] = rgb.green;
                        this.data[location + 2] = rgb.blue;
                        this.data[location + 3] = 255;
                    } else {
                        this.data[location] = 0xff;
                        this.data[location + 1] = 0xff;
                        this.data[location + 2] = 0xff;
                        this.data[location + 3] = 0xff;
                    }
                }
                if (mode !== 0) {
                    this.pos += 4 - mode;
                }
            }
        }
    }

    bit15() {
        const dif_w = this.width % 3;
        const _11111 = parseInt("11111", 2),
            _1_5 = _11111;
        for (let y = this.height - 1; y >= 0; y--) {
            const line = this.bottom_up ? y : this.height - 1 - y;
            for (let x = 0; x < this.width; x++) {
                const B = this.view.getUint16(this.pos, true);
                this.pos += 2;
                const blue = (((B & _1_5) / _1_5) * 255) | 0;
                const green = ((((B >> 5) & _1_5) / _1_5) * 255) | 0;
                const red = ((((B >> 10) & _1_5) / _1_5) * 255) | 0;
                // const alpha = 0xff;

                const location = line * this.width * 4 + x * 4;

                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 0xff;
            }
            //skip extra bytes
            this.pos += dif_w;
        }
    }

    bit16() {
        const dif_w = (this.width % 2) * 2;
        //default xrgb555
        this.maskRed = 0x7c00;
        this.maskGreen = 0x3e0;
        this.maskBlue = 0x1f;
        this.mask0 = 0;

        if (this.compress === 3) {
            this.maskRed = this.view.getUint32(this.pos, true);
            this.pos += 4;
            this.maskGreen = this.view.getUint32(this.pos, true);
            this.pos += 4;
            this.maskBlue = this.view.getUint32(this.pos, true);
            this.pos += 4;
            this.mask0 = this.view.getUint32(this.pos, true);
            this.pos += 4;
        }

        const ns = [0, 0, 0];
        for (let i = 0; i < 16; i++) {
            if ((this.maskRed >> i) & 0x01) ns[0]++;
            if ((this.maskGreen >> i) & 0x01) ns[1]++;
            if ((this.maskBlue >> i) & 0x01) ns[2]++;
        }
        ns[1] += ns[0];
        ns[2] += ns[1];
        ns[0] = 8 - ns[0];
        ns[1] -= 8;
        ns[2] -= 8;

        for (let y = this.height - 1; y >= 0; y--) {
            const line = this.bottom_up ? y : this.height - 1 - y;
            for (let x = 0; x < this.width; x++) {
                const B = this.view.getUint16(this.pos, true);
                this.pos += 2;

                const blue = (B & this.maskBlue) << ns[0];
                const green = (B & this.maskGreen) >> ns[1];
                const red = (B & this.maskRed) >> ns[2];

                const location = line * this.width * 4 + x * 4;

                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 255;
            }
            //skip extra bytes
            this.pos += dif_w;
        }
    }

    bit24() {
        for (let y = this.height - 1; y >= 0; y--) {
            const line = this.bottom_up ? y : this.height - 1 - y;
            for (let x = 0; x < this.width; x++) {
                //Little Endian rgb
                const blue = this.view.getUint8(this.pos++);
                const green = this.view.getUint8(this.pos++);
                const red = this.view.getUint8(this.pos++);
                const location = line * this.width * 4 + x * 4;
                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 255;
            }
            //skip extra bytes
            this.pos += this.width % 4;
        }
    }

    /**
     * add 32bit decode func
     * @author soubok
     */
    bit32() {
        //BI_BITFIELDS
        if (this.compress === 3) {
            this.maskRed = this.view.getUint32(this.pos, true);
            this.pos += 4;
            this.maskGreen = this.view.getUint32(this.pos, true);
            this.pos += 4;
            this.maskBlue = this.view.getUint32(this.pos, true);
            this.pos += 4;
            this.mask0 = this.view.getUint32(this.pos, true);
            this.pos += 4;
            for (let y = this.height - 1; y >= 0; y--) {
                const line = this.bottom_up ? y : this.height - 1 - y;
                for (let x = 0; x < this.width; x++) {
                    //Little Endian rgba
                    this.view.getUint8(this.pos++); //alpha
                    const blue = this.view.getUint8(this.pos++);
                    const green = this.view.getUint8(this.pos++);
                    const red = this.view.getUint8(this.pos++);
                    const location = line * this.width * 4 + x * 4;
                    this.data[location] = red;
                    this.data[location + 1] = green;
                    this.data[location + 2] = blue;
                    this.data[location + 3] = 0xff;
                }
            }
        } else {
            for (let y = this.height - 1; y >= 0; y--) {
                const line = this.bottom_up ? y : this.height - 1 - y;
                for (let x = 0; x < this.width; x++) {
                    //Little Endian argb
                    const blue = this.view.getUint8(this.pos++);
                    const green = this.view.getUint8(this.pos++);
                    const red = this.view.getUint8(this.pos++);
                    this.view.getUint8(this.pos++); //alpha
                    const location = line * this.width * 4 + x * 4;
                    this.data[location] = red;
                    this.data[location + 1] = green;
                    this.data[location + 2] = blue;
                    this.data[location + 3] = 0xff;
                }
            }
        }
    }
}

export function decodeBmp(view: DataView, data: Uint8ClampedArray) {
    new BmpDecoder(view, data);
}

export function readBMPSize(view: DataView) {
    return {
        width: view.getUint32(18, true),
        height: view.getUint32(22, true),
    };
}
