import { NumBool } from "stratum/common/types";
import { Hyperbase } from "stratum/fileFormats/vdr";
import { SceneGroup } from "./sceneGroup";

export interface SceneMember {
    hyperbase: Hyperbase | null;
    readonly markDeleted: boolean;
    handle: number;
    name: string;

    delete(): void;
    getChildByName(name: string): number;
    setVisibility(visible: boolean): NumBool;

    // groups
    minX(): number;
    minY(): number;
    maxX(): number;
    maxY(): number;
    onParentChanged(parent: SceneGroup | null): void;
    onParentMoved(dx: number, dy: number): void;
    onParentResized(centerX: number, centerY: number, dx: number, dy: number): void;
    onParentRotated(centerX: number, centerY: number, angle: number): void;
}

export interface SceneVisualMember extends SceneMember {
    render(ctx: CanvasRenderingContext2D, sceneX: number, sceneY: number, layers: number): void;
    tryClick(x: number, y: number, layers: number): this | SceneGroup | undefined;
}
