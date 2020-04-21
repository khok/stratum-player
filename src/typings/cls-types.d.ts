/**
 * Базовые типы данных, находящиеся в файлах .cls, .stt
 */

declare module "cls-types" {
    import { VectorDrawData } from "vdr-types";
    import { ParsedCode } from "vm-types";

    export interface VarSetData {
        handle: number;
        classname: string;
        /** `Не используется` */
        classId: number;
        varData: { name: string; value: string }[];
        childSets: VarSetData[];
    }

    export interface VarData {
        name: string;
        /** `Не используется` */
        description: string;
        defaultValue: string;
        type: "FLOAT" | "STRING" | "HANDLE" | "COLORREF";
        flags: number;
    }

    export interface LinkData {
        /**
         * Дескриптор соединяемого объекта. Если не 0, ищется дочерний объект, если 0, то используется этот объект.
         */
        handle1: number;
        handle2: number;
        /** `Не используется` */
        contactPadHandle: number;
        /** `Не используется` */
        linkHandle: number;
        connectedVars: { name1: string; name2: string }[];
        flags: number;
    }

    export interface ChildData {
        classname: string;
        handle: number;
        nameOnScheme: string;
        position: { x: number; y: number };
        // flag =  0 | stream.readBytes(1)[0];
        flags: number;
    }

    export interface ClassData {
        fileName: string;

        name: string;
        version: number;

        vars?: VarData[];
        links?: LinkData[];
        childInfo?: ChildData[];
        scheme?: VectorDrawData;
        image?: VectorDrawData;
        bytecode?: {
            /** `Не используется` */
            original: Uint8Array;
            parsed?: ParsedCode;
        };
        iconFile?: string;
        /** `Не используется` */
        iconIndex?: number;
        /** `Не используется` */
        sourceCode?: string;
        /** `Не используется` */
        description?: string;
        /** `Не используется` */
        varsize?: number;
        /** `Не используется` */
        flags?: number;
        /** `Не используется` */
        classId?: number;
        /** `Не используется` */
        date?: {
            sec: number;
            min: number;
            hour: number;
            day: number;
            month: number;
            year: number;
        };
    }
}
