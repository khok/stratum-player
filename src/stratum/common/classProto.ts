import {
    BytecodeParser,
    ClassChild,
    ClassInfoBody,
    ClassInfoHeader,
    ClassLink,
    ClassVar,
    readClsFileBody,
    readClsFileHeader,
} from "stratum/fileFormats/cls";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { extractDirDos } from "stratum/helpers/pathOperations";
import { VarCode } from "./varCode";
import { parseVarType, parseVarValue } from "./varParsers";

type LazyBody<TVmCode> =
    | {
          loaded: true;
          body: ClassInfoBody<TVmCode>;
      }
    | {
          loaded: false;
          stream: BinaryStream;
      };

function parseClassVars(values: ClassVar[]): ClassProtoVars {
    const typeCodes = values.map((v) => parseVarType(v.type));
    return {
        varNameToId: new Map<string, number>(values.map((v, idx) => [v.name.toLowerCase(), idx])),
        names: values.map((v) => v.name),
        typeCodes,
        defaultValues: values.map((v, idx) => {
            return v.defaultValue === "" ? undefined : parseVarValue(typeCodes[idx], v.defaultValue);
        }),
    };
}

interface ClassProtoVars {
    varNameToId: Map<string, number>;
    names: string[];
    typeCodes: VarCode[];
    defaultValues: (string | number | undefined)[];
}

/*
 * Прототип имиджа, обертка над более низкоуровневыми функциями чтения содержимого имиджа.
 * Реализует ленивую подгрузку данных.
 */
export class ClassProto<TVmCode> {
    private header: ClassInfoHeader;
    private _vars?: ClassProtoVars;
    private __body: LazyBody<TVmCode>;

    readonly filepathDos?: string;
    readonly directoryDos?: string;

    private _blocks: {
        readScheme: boolean;
        readImage: boolean;
        parseBytecode?: BytecodeParser<TVmCode>;
    };

    private get body(): ClassInfoBody<TVmCode> {
        const { __body } = this;
        if (__body.loaded) return __body.body;

        const body = readClsFileBody(__body.stream, this.name, this._blocks);
        this.__body = {
            loaded: true,
            body,
        };
        return body;
    }

    constructor(stream: BinaryStream, bytecodeParser?: BytecodeParser<TVmCode>) {
        this.filepathDos = stream.meta.filepathDos;
        this.directoryDos = this.filepathDos && extractDirDos(this.filepathDos);
        this._blocks = {
            readScheme: true,
            readImage: true,
            parseBytecode: bytecodeParser,
        };

        this.header = readClsFileHeader(stream);
        stream.meta.fileversion = this.header.version;
        this.__body = { loaded: false, stream };
    }

    get name(): string {
        return this.header.name;
    }

    get children(): ClassChild[] | undefined {
        return this.body.children;
    }

    get vars(): ClassProtoVars | undefined {
        if (this._vars) return this._vars;

        const values = this.body.vars;
        if (!values) return undefined;
        const parsedVars = parseClassVars(values);
        this._vars = parsedVars;
        return parsedVars;
    }

    get links(): ClassLink[] | undefined {
        return this.body.links;
    }

    get image(): VectorDrawing | undefined {
        return this.body.image;
    }

    get iconFile(): string | undefined {
        return this.body.iconFile;
    }

    get scheme(): VectorDrawing | undefined {
        return this.body.scheme;
    }

    get code(): TVmCode | undefined {
        return this.body.code;
    }
}
