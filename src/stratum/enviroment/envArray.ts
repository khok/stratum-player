import { NumBool } from "stratum/common/types";
import { VarType } from "stratum/common/varType";

export interface EnvArraySortingAlgo {
    desc: boolean;
    field: string;
}

interface EnvArrayFloatElement {
    type: "FLOAT";
    value: number;
}

interface EnvArrayHandleElement {
    type: "HANDLE";
    value: number;
}

interface EnvArrayStringElement {
    type: "STRING";
    value: string;
}

type EnvArrayPrimitive = EnvArrayFloatElement | EnvArrayHandleElement | EnvArrayStringElement;

interface EnvArrayStructElement {
    type: "STRUCT";
    value: Map<string, EnvArrayPrimitive>;
}

export class EnvArray {
    private fields: (EnvArrayPrimitive | EnvArrayStructElement)[];
    constructor() {
        this.fields = [];
    }

    insert(type: "FLOAT" | "HANDLE" | "STRING"): NumBool {
        if (type === "FLOAT") {
            this.fields.push({ type: type, value: 0 });
            return 1;
        }
        if (type === "HANDLE") {
            this.fields.push({ type: type, value: 0 });
            return 1;
        }
        if (type === "STRING") {
            this.fields.push({ type: type, value: "" });
            return 1;
        }
        throw Error(`Неизвестный тип элемента: ${type}`);
    }

    insertClass(data: [string, VarType][]): NumBool {
        const entries = data.map<[string, EnvArrayPrimitive]>((d) => {
            const name = d[0].toUpperCase();
            switch (d[1]) {
                case VarType.Float:
                    return [name, { type: "FLOAT", value: 0 }];
                case VarType.String:
                    return [name, { type: "STRING", value: "" }];
                default:
                    return [name, { type: "HANDLE", value: 0 }];
            }
        });

        this.fields.push({ type: "STRUCT", value: new Map(entries) });
        return 1;
    }

    set(idx: number, field: string, value: string | number): void {
        if (idx < 0 || idx > this.fields.length - 1) return;
        let elem = this.fields[idx];
        if (elem.type === "STRUCT") {
            const subfield = elem.value.get(field.toUpperCase());
            if (!subfield) return;
            elem = subfield;
        }
        // if (field !== "" && field.toLowerCase() !== elem.type) return;
        if (typeof value === "string") {
            if (elem.type !== "STRING") return;
            elem.value = value;
        } else {
            if (elem.type === "STRING") return;
            elem.value = value;
        }
    }
    remove(idx: number): NumBool {
        return this.fields.splice(idx, 1).length ? 1 : 0;
    }
    count(): number {
        return this.fields.length;
    }

    type(idx: number): string {
        if (idx < 0 || idx > this.fields.length - 1) return "";
        return this.fields[idx].type;
    }

    getFloat(idx: number, field: string): number {
        if (idx < 0 || idx > this.fields.length - 1) return 0;
        let elem = this.fields[idx];
        if (elem.type === "STRUCT") {
            const subfield = elem.value.get(field.toUpperCase());
            if (!subfield) return 0;
            elem = subfield;
        }
        // (заметка: В стратум есть баг при попытке получить элемента строку через vGetF). Тут его нет.
        return elem.type === "FLOAT" ? elem.value : 0;
    }
    getHandle(idx: number, field: string): number {
        if (idx < 0 || idx > this.fields.length - 1) return 0;
        let elem = this.fields[idx];
        if (elem.type === "STRUCT") {
            const subfield = elem.value.get(field.toUpperCase());
            if (!subfield) return 0;
            elem = subfield;
        }
        return elem.type === "HANDLE" ? elem.value : 0;
    }
    getString(idx: number, field: string): string {
        if (idx < 0 || idx > this.fields.length - 1) return "";
        let elem = this.fields[idx];
        if (elem.type === "STRUCT") {
            const subfield = elem.value.get(field.toUpperCase());
            if (!subfield) return "";
            elem = subfield;
        }
        return elem.type === "STRING" ? elem.value : "";
    }

    sort(algo?: EnvArraySortingAlgo[]): NumBool {
        if (!algo || algo.length === 0) {
            //FIXME: Возможно, не совсем корректная сортировка для разных типов данных.
            this.fields.sort((a, b) => (a.value as number) - (b.value as number));
            return 1;
        }
        if (algo.length === 1) {
            if (algo[0].desc) {
                this.fields.sort((a, b) => (b.value as number) - (a.value as number));
            } else {
                this.fields.sort((a, b) => (a.value as number) - (b.value as number));
            }
            return 1;
        }
        console.log(algo);
        throw new Error("Сортиврока по полям не реализована");
    }
}
