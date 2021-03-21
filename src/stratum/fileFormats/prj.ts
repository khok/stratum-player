//project.cpp:592
import { BinaryReader, FileReadingError, FileSignatureError } from "stratum/helpers/binaryReader";
import { EntryCode } from "./entryCode";

const settingEntryNameMap: { [index: string]: keyof ProjectSettings } = {
    addlib: "classSearchPaths",
    MathMode: "mathmode",
    PerIdle: "perIdle",
    run_mode: "runMode",
    runtimer: "runTimer",
    user_email: "userEmail",
    user_name: "userName",
    user_addr: "userAddress",
    user_org: "userOrganization",
    user_phone: "userPhone",
};

export interface ProjectSettings {
    classSearchPaths?: string;
    mathmode?: number;
    perIdle?: number;
    runMode?: number;
    runTimer?: number;
    userEmail?: string;
    userName?: string;
    userAddress?: string;
    userOrganization?: string;
    userPhone?: string;
}

export interface WatchedVariable {
    path: number[];
    name: string;
    info: string;
}

export interface ProjectInfo {
    rootClassName: string;
    settings?: ProjectSettings;
    watchedVariables?: WatchedVariable[];
}

function readSettings(reader: BinaryReader): ProjectSettings {
    const res: ProjectSettings = {};

    const varCount = reader.uint16();
    for (let i = 0; i < varCount; i++) {
        const bufSize = reader.uint16();
        //vars_m.h:21
        const valueCode = reader.byte();
        const nameLength = reader.byte();
        const entryName = reader.fixedString(nameLength - 1);
        reader.byte(); //нуль-терминатор
        let entryValue;
        switch (valueCode) {
            case 0:
                entryValue = reader.int32();
                break;
            case 1:
                entryValue = reader.float64();
                break;
            case 2:
                entryValue = reader.fixedString(bufSize - nameLength - 3);
                reader.byte();
                break;
            default:
                throw new FileReadingError(reader, `Ошибка в чтении настроек проекта: неизвестный код значения ${valueCode}`);
        }
        const t = settingEntryNameMap[entryName];
        if (t) res[t] = entryValue as any;
        else console.warn(`Неизвестная запись в настройках проекта: ${entryName} (${entryValue})`);
    }

    return res;
}

function readWatchedVars(reader: BinaryReader): WatchedVariable[] {
    const varCount = reader.uint16();
    const res = new Array<WatchedVariable>(varCount);
    for (let i = 0; i < varCount; i++) {
        const path = Array.from({ length: reader.uint16() }, () => reader.uint16());
        const name = reader.string();
        const info = reader.string();
        res[i] = { path, name, info };
    }
    return res;
}

export function readPrjFile(reader: BinaryReader): ProjectInfo {
    const sign = reader.uint16();
    if (sign !== 0x6849) throw new FileSignatureError(reader, sign, 0x6849);

    const res: ProjectInfo = { rootClassName: "" };
    let code = 0;
    while ((code = reader.uint16()) !== 0) {
        switch (code) {
            case EntryCode.PR_PASSWORD:
                reader.string();
                console.warn("Проект имеет пароль");
                break;
            case EntryCode.PR_MAINCLASS:
                res.rootClassName = reader.string();
                break;
            case EntryCode.PR_VARS:
                res.settings = readSettings(reader);
                break;
            case EntryCode.PR_WATCH:
                res.watchedVariables = readWatchedVars(reader);
                break;
        }
    }
    if (!res.rootClassName) throw new FileReadingError(reader, "Имя корневого имиджа не считано.");
    return res;
}
