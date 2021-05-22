import { NumBool } from "stratum/common/types";

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

export class EnvArray {
    // private fields : Map<string, EnvArrayFloatElement | EnvArrayHandleElement | EnvArrayStringElement>[];
    private fields: (EnvArrayFloatElement | EnvArrayHandleElement | EnvArrayStringElement)[];
    constructor() {
        this.fields = [];
    }
    insert(type: string): NumBool {
        const typeUC = type.toUpperCase();
        if (typeUC === "FLOAT") {
            this.fields.push({ type: typeUC, value: 0 });
            return 1;
        }
        if (typeUC === "HANDLE") {
            this.fields.push({ type: typeUC, value: 0 });
            return 1;
        }
        if (typeUC === "STRING") {
            this.fields.push({ type: typeUC, value: "" });
            return 1;
        }
        throw Error(`Вставка имиджа ${typeUC} в массив не реализована`);
    }
    set(idx: number, _: /*field*/ string, value: string | number): void {
        if (idx < 0 || idx > this.fields.length - 1) return;
        const elem = this.fields[idx];
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

    getFloat(idx: number, _: /*field*/ string): number {
        if (idx < 0 || idx > this.fields.length - 1) return 0;
        const elem = this.fields[idx];
        // (заметка: В стратум есть баг при попытке получить элемента строку через vGetF). Тут его нет.
        return elem.type === "FLOAT" ? elem.value : 0;
    }
    getHandle(idx: number, _: /*field*/ string): number {
        if (idx < 0 || idx > this.fields.length - 1) return 0;
        const elem = this.fields[idx];
        return elem.type === "HANDLE" ? elem.value : 0;
    }
    getString(idx: number, _: /*field*/ string): string {
        if (idx < 0 || idx > this.fields.length - 1) return "";
        const elem = this.fields[idx];
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
