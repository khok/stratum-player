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

import bops from "bops";

function BmpDecoder(buffer, is_with_alpha, offset = 0) {
    this.pos = offset;
    this.buffer = buffer;
    this.is_with_alpha = !!is_with_alpha;
    this.bottom_up = true;
    this.flag = bops.to(bops.subarray(this.buffer, this.pos, this.pos + 2));
    this.pos += 2;
    if (this.flag != "BM") throw new Error("Invalid BMP File");
    this.parseHeader();
    this.parseRGBA();
}

BmpDecoder.prototype.parseHeader = function() {
    this.fileSize = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.reserved = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.offset = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.headerSize = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.width = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.height = bops.readInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.planes = bops.readUInt16LE(this.buffer, this.pos);
    this.pos += 2;
    this.bitPP = bops.readUInt16LE(this.buffer, this.pos);
    this.pos += 2;
    this.compress = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.rawSize = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.hr = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.vr = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.colors = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;
    this.importantColors = bops.readUInt32LE(this.buffer, this.pos);
    this.pos += 4;

    if (this.bitPP === 16 && this.is_with_alpha) {
        this.bitPP = 15;
    }
    if (this.bitPP < 15) {
        var len = this.colors === 0 ? 1 << this.bitPP : this.colors;
        this.palette = new Array(len);
        for (var i = 0; i < len; i++) {
            var blue = bops.readUInt8(this.buffer, this.pos++);
            var green = bops.readUInt8(this.buffer, this.pos++);
            var red = bops.readUInt8(this.buffer, this.pos++);
            var quad = bops.readUInt8(this.buffer, this.pos++);
            this.palette[i] = {
                red: red,
                green: green,
                blue: blue,
                quad: quad
            };
        }
    }
    if (this.height < 0) {
        this.height *= -1;
        this.bottom_up = false;
    }
};

BmpDecoder.prototype.parseRGBA = function() {
    var bitn = "bit" + this.bitPP;
    var len = this.width * this.height * 4;
    this.data = new Buffer(len);
    this[bitn]();
};

BmpDecoder.prototype.bit1 = function() {
    var xlen = Math.ceil(this.width / 8);
    var mode = xlen % 4;
    var y = this.height >= 0 ? this.height - 1 : -this.height;
    for (var y = this.height - 1; y >= 0; y--) {
        var line = this.bottom_up ? y : this.height - 1 - y;
        for (var x = 0; x < xlen; x++) {
            var b = bops.readUInt8(this.buffer, this.pos++);
            var location = line * this.width * 4 + x * 8 * 4;
            for (var i = 0; i < 8; i++) {
                if (x * 8 + i < this.width) {
                    var rgb = this.palette[(b >> (7 - i)) & 0x1];

                    this.data[location + i * 4] = rgb.red;
                    this.data[location + i * 4 + 1] = rgb.green;
                    this.data[location + i * 4 + 2] = rgb.blue;
                    this.data[location + i * 4 + 3] = 0;
                } else {
                    break;
                }
            }
        }

        if (mode != 0) {
            this.pos += 4 - mode;
        }
    }
};

BmpDecoder.prototype.bit4 = function() {
    //RLE-4
    if (this.compress == 2) {
        this.data.fill(0xff);

        var location = 0;
        var lines = this.bottom_up ? this.height - 1 : 0;
        var low_nibble = false; //for all count of pixel

        while (location < this.data.length) {
            var a = bops.readUInt8(this.buffer, this.pos++);
            var b = bops.readUInt8(this.buffer, this.pos++);
            //absolute mode
            if (a == 0) {
                if (b == 0) {
                    //line end
                    if (this.bottom_up) {
                        lines--;
                    } else {
                        lines++;
                    }
                    location = lines * this.width * 4;
                    low_nibble = false;
                    continue;
                } else if (b == 1) {
                    //image end
                    break;
                } else if (b == 2) {
                    //offset x,y
                    var x = bops.readUInt8(this.buffer, this.pos++);
                    var y = bops.readUInt8(this.buffer, this.pos++);
                    if (this.bottom_up) {
                        lines -= y;
                    } else {
                        lines += y;
                    }

                    location += y * this.width * 4 + x * 4;
                } else {
                    var c = bops.readUInt8(this.buffer, this.pos++);
                    for (var i = 0; i < b; i++) {
                        if (low_nibble) {
                            setPixelData.call(this, c & 0x0f);
                        } else {
                            setPixelData.call(this, (c & 0xf0) >> 4);
                        }

                        if (i & 1 && i + 1 < b) {
                            c = bops.readUInt8(this.buffer, this.pos++);
                        }

                        low_nibble = !low_nibble;
                    }

                    if ((((b + 1) >> 1) & 1) == 1) {
                        this.pos++;
                    }
                }
            } else {
                //encoded mode
                for (var i = 0; i < a; i++) {
                    if (low_nibble) {
                        setPixelData.call(this, b & 0x0f);
                    } else {
                        setPixelData.call(this, (b & 0xf0) >> 4);
                    }
                    low_nibble = !low_nibble;
                }
            }
        }

        function setPixelData(rgbIndex) {
            var rgb = this.palette[rgbIndex];
            this.data[location] = rgb.red;
            this.data[location + 1] = rgb.green;
            this.data[location + 2] = rgb.blue;
            this.data[location + 3] = 255;
            location += 4;
        }
    } else {
        var xlen = Math.ceil(this.width / 2);
        var mode = xlen % 4;
        for (var y = this.height - 1; y >= 0; y--) {
            var line = this.bottom_up ? y : this.height - 1 - y;
            for (var x = 0; x < xlen; x++) {
                var b = bops.readUInt8(this.buffer, this.pos++);
                var location = line * this.width * 4 + x * 2 * 4;

                var before = b >> 4;
                var after = b & 0x0f;

                var rgb = this.palette[before];
                this.data[location] = rgb.red;
                this.data[location + 1] = rgb.green;
                this.data[location + 2] = rgb.blue;
                this.data[location + 3] = 255;

                if (x * 2 + 1 >= this.width) break;

                rgb = this.palette[after];

                this.data[location + 4] = rgb.red;
                this.data[location + 4 + 1] = rgb.green;
                this.data[location + 4 + 2] = rgb.blue;
                this.data[location + 4 + 3] = 0;
            }

            if (mode != 0) {
                this.pos += 4 - mode;
            }
        }
    }
};

BmpDecoder.prototype.bit8 = function() {
    //RLE-8
    if (this.compress == 1) {
        this.data.fill(0xff);

        var location = 0;
        var lines = this.bottom_up ? this.height - 1 : 0;

        while (location < this.data.length) {
            var a = bops.readUInt8(this.buffer, this.pos++);
            var b = bops.readUInt8(this.buffer, this.pos++);
            //absolute mode
            if (a == 0) {
                if (b == 0) {
                    //line end
                    if (this.bottom_up) {
                        lines--;
                    } else {
                        lines++;
                    }
                    location = lines * this.width * 4;
                    continue;
                } else if (b == 1) {
                    //image end
                    break;
                } else if (b == 2) {
                    //offset x,y
                    var x = bops.readUInt8(this.buffer, this.pos++);
                    var y = bops.readUInt8(this.buffer, this.pos++);
                    if (this.bottom_up) {
                        lines -= y;
                    } else {
                        lines += y;
                    }

                    location += y * this.width * 4 + x * 4;
                } else {
                    for (var i = 0; i < b; i++) {
                        var c = bops.readUInt8(this.buffer, this.pos++);
                        setPixelData.call(this, c);
                    }
                    if (b & (1 == 1)) {
                        this.pos++;
                    }
                }
            } else {
                //encoded mode
                for (var i = 0; i < a; i++) {
                    setPixelData.call(this, b);
                }
            }
        }

        function setPixelData(rgbIndex) {
            var rgb = this.palette[rgbIndex];
            this.data[location] = rgb.red;
            this.data[location + 1] = rgb.green;
            this.data[location + 2] = rgb.blue;
            this.data[location + 3] = 255;
            location += 4;
        }
    } else {
        var mode = this.width % 4;
        for (var y = this.height - 1; y >= 0; y--) {
            var line = this.bottom_up ? y : this.height - 1 - y;
            for (var x = 0; x < this.width; x++) {
                var b = bops.readUInt8(this.buffer, this.pos++);
                var location = line * this.width * 4 + x * 4;
                if (b < this.palette.length) {
                    var rgb = this.palette[b];

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
            if (mode != 0) {
                this.pos += 4 - mode;
            }
        }
    }
};

BmpDecoder.prototype.bit15 = function() {
    var dif_w = this.width % 3;
    var _11111 = parseInt("11111", 2),
        _1_5 = _11111;
    for (var y = this.height - 1; y >= 0; y--) {
        var line = this.bottom_up ? y : this.height - 1 - y;
        for (var x = 0; x < this.width; x++) {
            var B = bops.readUInt16LE(this.buffer, this.pos);
            this.pos += 2;
            var blue = (((B & _1_5) / _1_5) * 255) | 0;
            var green = ((((B >> 5) & _1_5) / _1_5) * 255) | 0;
            var red = ((((B >> 10) & _1_5) / _1_5) * 255) | 0;
            var alpha = 0xff;

            var location = line * this.width * 4 + x * 4;

            this.data[location] = red;
            this.data[location + 1] = green;
            this.data[location + 2] = blue;
            this.data[location + 3] = 0xff;
        }
        //skip extra bytes
        this.pos += dif_w;
    }
};

BmpDecoder.prototype.bit16 = function() {
    var dif_w = (this.width % 2) * 2;
    //default xrgb555
    this.maskRed = 0x7c00;
    this.maskGreen = 0x3e0;
    this.maskBlue = 0x1f;
    this.mask0 = 0;

    if (this.compress == 3) {
        this.maskRed = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        this.maskGreen = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        this.maskBlue = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        this.mask0 = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
    }

    var ns = [0, 0, 0];
    for (var i = 0; i < 16; i++) {
        if ((this.maskRed >> i) & 0x01) ns[0]++;
        if ((this.maskGreen >> i) & 0x01) ns[1]++;
        if ((this.maskBlue >> i) & 0x01) ns[2]++;
    }
    ns[1] += ns[0];
    ns[2] += ns[1];
    ns[0] = 8 - ns[0];
    ns[1] -= 8;
    ns[2] -= 8;

    for (var y = this.height - 1; y >= 0; y--) {
        var line = this.bottom_up ? y : this.height - 1 - y;
        for (var x = 0; x < this.width; x++) {
            var B = bops.readUInt16LE(this.buffer, this.pos);
            this.pos += 2;

            var blue = (B & this.maskBlue) << ns[0];
            var green = (B & this.maskGreen) >> ns[1];
            var red = (B & this.maskRed) >> ns[2];

            var location = line * this.width * 4 + x * 4;

            this.data[location] = red;
            this.data[location + 1] = green;
            this.data[location + 2] = blue;
            this.data[location + 3] = 255;
        }
        //skip extra bytes
        this.pos += dif_w;
    }
};

BmpDecoder.prototype.bit24 = function() {
    for (var y = this.height - 1; y >= 0; y--) {
        var line = this.bottom_up ? y : this.height - 1 - y;
        for (var x = 0; x < this.width; x++) {
            //Little Endian rgb
            var blue = bops.readUInt8(this.buffer, this.pos++);
            var green = bops.readUInt8(this.buffer, this.pos++);
            var red = bops.readUInt8(this.buffer, this.pos++);
            var location = line * this.width * 4 + x * 4;
            this.data[location] = red;
            this.data[location + 1] = green;
            this.data[location + 2] = blue;
            this.data[location + 3] = 255;
        }
        //skip extra bytes
        this.pos += this.width % 4;
    }
};

/**
 * add 32bit decode func
 * @author soubok
 */
BmpDecoder.prototype.bit32 = function() {
    //BI_BITFIELDS
    if (this.compress == 3) {
        this.maskRed = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        this.maskGreen = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        this.maskBlue = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        this.mask0 = bops.readUInt32LE(this.buffer, this.pos);
        this.pos += 4;
        for (var y = this.height - 1; y >= 0; y--) {
            var line = this.bottom_up ? y : this.height - 1 - y;
            for (var x = 0; x < this.width; x++) {
                //Little Endian rgba
                var alpha = bops.readUInt8(this.buffer, this.pos++);
                var blue = bops.readUInt8(this.buffer, this.pos++);
                var green = bops.readUInt8(this.buffer, this.pos++);
                var red = bops.readUInt8(this.buffer, this.pos++);
                var location = line * this.width * 4 + x * 4;
                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 0xff;
            }
        }
    } else {
        for (var y = this.height - 1; y >= 0; y--) {
            var line = this.bottom_up ? y : this.height - 1 - y;
            for (var x = 0; x < this.width; x++) {
                //Little Endian argb
                var blue = bops.readUInt8(this.buffer, this.pos++);
                var green = bops.readUInt8(this.buffer, this.pos++);
                var red = bops.readUInt8(this.buffer, this.pos++);
                var alpha = bops.readUInt8(this.buffer, this.pos++);
                var location = line * this.width * 4 + x * 4;
                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 0xff;
            }
        }
    }
};

BmpDecoder.prototype.getData = function() {
    return this.data;
};

export function decode(bmpData) {
    var decoder = new BmpDecoder(bmpData);
    return decoder;
}
