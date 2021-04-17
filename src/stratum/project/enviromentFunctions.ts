import { EventSubscriber, NumBool } from "stratum/common/types";
import { EnviromentContextFunctions } from "stratum/compiler";
import { Hyperbase } from "stratum/fileFormats/vdr";
import { PathInfo } from "stratum/stratum";
import { Project } from "./project";

export interface EnviromentFunctions extends EnviromentContextFunctions {
    isWaiting(): boolean;
    setWaiting(): void;
    resetWaiting(): void;

    hyperCall(dir: PathInfo, hyp: Hyperbase): Promise<void>;

    openSchemeWindow(prj: Project, wname: string, className: string, attrib: string): number;
    loadSpaceWindow(prj: Project, dir: PathInfo, wname: string, fileName: string, attrib: string): number | Promise<number>;
    createWindowEx(
        prj: Project,
        dir: PathInfo,
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
    createObjectFromFile2D(dir: PathInfo, hspace: number, fileName: string, x: number, y: number, flags: number): number | Promise<number>;
    createStream(dir: PathInfo, type: string, name: string, flags: string): number | Promise<number>;
    mSaveAs(dir: PathInfo, q: number, fileName: string, flag: number): NumBool | Promise<NumBool>;
    mLoad(dir: PathInfo, q: number, fileName: string, flag: number): number | Promise<number>;

    setCapture(target: EventSubscriber, hspace: number): void;
    subscribe(target: EventSubscriber, wnameOrHspace: string | number, obj2d: number, message: number): void;
    unsubscribe(target: EventSubscriber, wnameOrHspace: string | number, message: number): void;
}
