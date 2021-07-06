import { EventSubscriber, NumBool } from "stratum/common/types";
import { EnviromentContextFunctions } from "stratum/compiler";
import { PathInfo } from "stratum/stratum";
import { Project } from "./project";

/**
 * Функции контекста окружения.
 */
export interface EnviromentFunctions extends EnviromentContextFunctions {
    /**
     * Установлен ли флаг ожидания?
     *
     * Флаг ожидания используется для предотвращения выполнения следующего такта
     * до того, как выполнение предыдущего будет завершено.
     */
    isWaiting(): boolean;
    /**
     * Переводит окружение в режим ожидания.
     * Флаг устанавливается перед выполнением ожидания промиза.
     */
    setWaiting(): void;
    /**
     * Сбрасывает флаг ожидания.
     * Флаг сбрасывается после получения результата промиза.
     */
    resetWaiting(): void;

    openSchemeWindow(prj: Project, wname: string, className: string, attrib: string): number;
    loadSpaceWindow(prj: Project, wname: string, fileName: string, attrib: string): number | Promise<number>;
    createWindowEx(
        prj: Project,
        wname: string,
        parentWname: string,
        source: string,
        x: number,
        y: number,
        w: number,
        h: number,
        attrib: string
    ): number | Promise<number>;
    createDIB2d(dir: PathInfo, hspace: number, fileName: string): number | Promise<number>;
    createDoubleDib2D(dir: PathInfo, hspace: number, fileName: string): number | Promise<number>;
    loadCursor(dir: PathInfo, wnameOrHspace: string | number, filename: string): void;
    createObjectFromFile2D(dir: PathInfo, hspace: number, fileName: string, x: number, y: number, flags: number): number | Promise<number>;
    createStream(dir: PathInfo, type: string, name: string, flags: string): number | Promise<number>;
    mSaveAs(dir: PathInfo, q: number, fileName: string, flag: number): NumBool | Promise<NumBool>;
    mLoad(dir: PathInfo, q: number, fileName: string, flag: number): number | Promise<number>;

    setCapture(target: EventSubscriber, hspace: number, flags: number): void;
    subscribe(target: EventSubscriber, wnameOrHspace: string | number, obj2d: number, message: number, flags: number): void;
    unsubscribe(target: EventSubscriber, wnameOrHspace: string | number, message: number): void;
}
