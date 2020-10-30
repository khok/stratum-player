import { readNext } from "../Collection";
import { VdrEntry } from "../vdrEntry";

function readObject(stream) {
    return {
        handle: stream.uint16(),
        options: stream.uint16(),
        name: stream.meta.fileversion >= 0x0102 && stream.meta.fileversion < 0x0300 ? stream.string() : "",
    };

    // if (stream.meta.fileversion >= 0x0102 && stream.meta.fileversion < 0x0300) {
    //     data.name = stream.string()
    // }
    // return data;
}

function readObject2D(stream) {
    return {
        ...readObject(stream),
        position: stream.meta.fileversion < 0x200 ? stream.point2dInt() : stream.point2d(),
        size: stream.meta.fileversion < 0x200 ? stream.point2dInt() : stream.point2d(),
    };
}

function read_otGROUP(stream) {
    return {
        ...readObject(stream),
        childHandles: readNext(stream, true, VdrEntry.otPRIMARYCOLLECTION).data,
    };
}
function read_otGROUP2D(stream) {
    return read_otGROUP(stream);
}
// function read_otRGROUP2D(stream) {
// throw Error('not here');
// return readObject(stream);
// }

// function read_otGROUP3D(stream) {
//     throw Error('otGROUP3D not supported');
// }
// function read_otOBJECT3D(stream) {
//     throw Error('otOBJECT3D not supported');
// }
// function read_otCAMERA3D(stream) {
//     throw Error('otCAMERA3D not supported');
// }
// function read_otLIGHT3D(stream) {
//     throw Error('otLIGHT3D not supported');
// }

function read_otLINE2D(stream) {
    let data = {
        ...readObject2D(stream),
        penHandle: stream.uint16(),
        brushHandle: stream.uint16(),
    };
    const pointCount = stream.uint16();

    data.points = new Array(pointCount);
    for (let i = 0; i < pointCount; i++) data.points[i] = stream.meta.fileversion < 0x200 ? stream.point2dInt() : stream.point2d();

    if (stream.meta.fileversion <= 0x0200) return data;

    const size = stream.bytes(1)[0];

    if (size) data.arrows = stream.bytes(size);

    return data;
}

function readBitmap(stream) {
    return {
        ...readObject2D(stream),
        bmpOrigin: stream.meta.fileversion < 0x200 ? stream.point2dInt() : stream.point2d(),
        bmpSize: stream.meta.fileversion < 0x200 ? stream.point2dInt() : stream.point2d(),
        bmpAngle: stream.int16(),
        bmpHandle: stream.uint16(),
    };
}

function read_otTEXT2D(stream) {
    return {
        ...readObject2D(stream),
        textToolHandle: stream.uint16(),
        delta: stream.meta.fileversion < 0x200 ? stream.point2dInt() : stream.point2d(),
        angle: stream.int16(),
    };
}
// function read_otVIEW3D2D(stream) {
//     throw Error('otVIEW3D2D not supported');
// }
// function read_otUSEROBJECT2D(stream) {
//     throw Error('otUSEROBJECT2D not implemented');
//     return readObject2D(stream);
// }

//WINOBJ2D.cpp -> 29
function read_otCONTROL2D(stream) {
    const res = {
        ...readObject2D(stream),
        classname: stream.string(),
        text: stream.string(),
        dwStyle: stream.int32(),
        exStyle: stream.int32(),
        id: stream.uint16(),
        controlSize: stream.point2dInt(),
    };
    if (!["Edit", "Button", "ComboBox"].includes(res.classname)) throw new Error(`Неизвестный тип контрола: ${res.classname}`);
    stream.uint16(); //unused
    return res;
}

// function read_otEDITFRAME2D(stream) {
//     throw Error('otEDITFRAME2D not implemented');
//     // return readObject2D(stream);
// }
// function read_otROTATECENTER2D(stream) {
//     throw Error('otROTATECENTER2D not implemented');
//     // return readObject2D(stream);
// }

function read_otSPACE2D(stream) {
    return readObject2D(stream);
}
// function read_otSPACE3D(stream) {
//     throw Error('otSPACE3D not supported');
// }

export function initObjects(funcs) {
    funcs.otGROUP = read_otGROUP;
    funcs.otGROUP2D = read_otGROUP2D;
    // funcs.otRGROUP2D = read_otRGROUP2D;
    //funcs.otGROUP3D = read_otGROUP3D;
    //funcs.otOBJECT3D = read_otOBJECT3D;
    //funcs.otCAMERA3D = read_otCAMERA3D;
    //funcs.otLIGHT3D = read_otLIGHT3D;
    funcs.otLINE2D = read_otLINE2D;
    funcs.otBITMAP2D = readBitmap;
    funcs.otDOUBLEBITMAP2D = readBitmap;
    funcs.otTEXT2D = read_otTEXT2D;
    //funcs.otVIEW3D2D = read_otVIEW3D2D;
    // funcs.otUSEROBJECT2D = read_otUSEROBJECT2D;
    funcs.otCONTROL2D = read_otCONTROL2D;
    // funcs.otEDITFRAME2D = read_otEDITFRAME2D;
    // funcs.otROTATECENTER2D = read_otROTATECENTER2D;
    funcs.otSPACE2D = read_otSPACE2D;
    //funcs.otSPACE3D = read_otSPACE3D;
}
