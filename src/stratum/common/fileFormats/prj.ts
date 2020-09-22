//project.cpp:592
import { BinaryStream } from "~/helpers/binaryStream";
import { FileReadingError, FileSignatureError } from "../errors";
import { extractDirectory } from "~/helpers/pathOperations";
import { EntryCode } from "./entryCode";

export interface ProjectSettings {
    libraryPaths?: string;
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
    filename: string;
    baseDirectory: string;
    rootClassName: string;
    settings?: ProjectSettings;
    watchedVariables?: WatchedVariable[];
}

const settingEntryNameMap: { [index: string]: keyof ProjectSettings } = {
    addlib: "libraryPaths",
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

function readSettings(stream: BinaryStream): ProjectSettings {
    const res: ProjectSettings = {};

    const varCount = stream.readWord();
    for (let i = 0; i < varCount; i++) {
        const bufSize = stream.readWord();
        //vars_m.h:21
        const valueCode = stream.readByte();
        const nameLength = stream.readByte();
        const entryName = stream.readFixedString(nameLength - 1);
        stream.readByte(); //нуль-терминатор
        let entryValue;
        switch (valueCode) {
            case 0:
                entryValue = stream.readLong();
                break;
            case 1:
                entryValue = stream.readDouble();
                break;
            case 2:
                entryValue = stream.readFixedString(bufSize - nameLength - 3);
                stream.readByte();
                break;
            default:
                throw new FileReadingError(stream.filename, `Ошибка в чтении настроек проекта: неизвестный код значения ${valueCode}`);
        }
        const t = settingEntryNameMap[entryName];
        if (t) res[t] = entryValue as any;
        else console.warn(`Неизвестная запись в настройках проекта: ${entryName} (${entryValue})`);
    }

    return res;
}

function readWatchedVars(stream: BinaryStream): WatchedVariable[] {
    const varCount = stream.readWord();
    const res = new Array<WatchedVariable>(varCount);
    for (let i = 0; i < varCount; i++) {
        const path = Array.from({ length: stream.readWord() }, () => stream.readWord());
        const name = stream.readString();
        const info = stream.readString();
        res[i] = { path, name, info };
    }
    return res;
}

export function readPrjFile(stream: BinaryStream): ProjectInfo {
    const sign = stream.readWord();
    if (sign !== 0x6849) throw new FileSignatureError(stream.filename, sign, 0x6849);

    const filename = stream.filename;
    const baseDirectory = extractDirectory(filename);

    const res: ProjectInfo = { rootClassName: "", filename, baseDirectory };
    let code = 0;
    while ((code = stream.readWord()) !== 0) {
        switch (code) {
            case EntryCode.PR_PASSWORD:
                stream.readString();
                console.warn("Проект имеет пароль");
                break;
            case EntryCode.PR_MAINCLASS:
                res.rootClassName = stream.readString();
                break;
            case EntryCode.PR_VARS:
                res.settings = readSettings(stream);
                break;
            case EntryCode.PR_WATCH:
                res.watchedVariables = readWatchedVars(stream);
                break;
        }
    }
    if (!res.rootClassName) throw new FileReadingError(stream.filename, "Имя корневого имиджа не считано.");
    return res;
}
