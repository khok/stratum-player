import { BinaryStream } from "/helpers/binaryStream";
import { extractDirectory } from "/helpers/pathOperations";
import {
    BytecodeParser,
    ClassChild,
    ClassInfoBody,
    ClassInfoHeader,
    ClassLink,
    ClassVar,
    readClsFileBody,
    readClsFileHeader,
} from "./fileFormats/cls";
import { VectorDrawing } from "./fileFormats/vdr/types/vectorDrawing";
import { VarCode } from "./varCode";
import { parseVarType, parseVarValue } from "./varParsers";

export interface ClassProtoVars {
    varNameToId: Map<string, number>;
    names: string[];
    typeCodes: VarCode[];
    defaultValues: (string | number | undefined)[];
}

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

/*
 * Прототип имиджа, обертка над более низкоуровневыми функциями чтения содержимого имиджа.
 * Реализует ленивую подгрузку данных.
 */
export class ClassPrototype<TVmCode> {
    readonly filename: string;
    readonly directory: string;

    private header: ClassInfoHeader;
    private _body?: ClassInfoBody<TVmCode>;
    private stream?: BinaryStream;

    private _vars?: ClassProtoVars;

    private blocks: {
        readScheme: boolean;
        readImage: boolean;
        parseBytecode?: BytecodeParser<TVmCode>;
    };

    constructor(stream: BinaryStream, bytecodeParser?: BytecodeParser<TVmCode>) {
        this.blocks = {
            readScheme: true,
            readImage: true,
            parseBytecode: bytecodeParser,
        };
        this.header = readClsFileHeader(stream);
        stream.fileversion = this.header.version;

        this.filename = stream.filename;
        this.directory = extractDirectory(stream.filename);
        this.stream = stream;
    }

    private get body(): ClassInfoBody<TVmCode> {
        if (!this._body) {
            this._body = readClsFileBody(this.stream!, this.name, this.blocks);
            this.stream = undefined;
        }
        return this._body;
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
