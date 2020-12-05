//project.cpp:592
import { BinaryStream, FileReadingError, FileSignatureError } from "stratum/helpers/binaryStream";
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

function readSettings(stream: BinaryStream): ProjectSettings {
    const res: ProjectSettings = {};

    const varCount = stream.uint16();
    for (let i = 0; i < varCount; i++) {
        const bufSize = stream.uint16();
        //vars_m.h:21
        const valueCode = stream.byte();
        const nameLength = stream.byte();
        const entryName = stream.fixedString(nameLength - 1);
        stream.byte(); //нуль-терминатор
        let entryValue;
        switch (valueCode) {
            case 0:
                entryValue = stream.int32();
                break;
            case 1:
                entryValue = stream.float64();
                break;
            case 2:
                entryValue = stream.fixedString(bufSize - nameLength - 3);
                stream.byte();
                break;
            default:
                throw new FileReadingError(stream, `Ошибка в чтении настроек проекта: неизвестный код значения ${valueCode}`);
        }
        const t = settingEntryNameMap[entryName];
        if (t) res[t] = entryValue as any;
        else console.warn(`Неизвестная запись в настройках проекта: ${entryName} (${entryValue})`);
    }

    return res;
}

function readWatchedVars(stream: BinaryStream): WatchedVariable[] {
    const varCount = stream.uint16();
    const res = new Array<WatchedVariable>(varCount);
    for (let i = 0; i < varCount; i++) {
        const path = Array.from({ length: stream.uint16() }, () => stream.uint16());
        const name = stream.string();
        const info = stream.string();
        res[i] = { path, name, info };
    }
    return res;
}

export function readPrjFile(stream: BinaryStream): ProjectInfo {
    const sign = stream.uint16();
    if (sign !== 0x6849) throw new FileSignatureError(stream, sign, 0x6849);

    const res: ProjectInfo = { rootClassName: "" };
    let code = 0;
    while ((code = stream.uint16()) !== 0) {
        switch (code) {
            case EntryCode.PR_PASSWORD:
                stream.string();
                console.warn("Проект имеет пароль");
                break;
            case EntryCode.PR_MAINCLASS:
                res.rootClassName = stream.string();
                break;
            case EntryCode.PR_VARS:
                res.settings = readSettings(stream);
                break;
            case EntryCode.PR_WATCH:
                res.watchedVariables = readWatchedVars(stream);
                break;
        }
    }
    if (!res.rootClassName) throw new FileReadingError(stream, "Имя корневого имиджа не считано.");
    return res;
}
