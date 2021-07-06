// import { Scene, SceneArgs, SceneElement } from "./scene/scene";
// import { BrushTool } from "./scene/tools/brushTool";
// import { PenTool } from "./scene/tools/penTool";
// import { ToolsAndElementsConstructors } from "./toolsAndElementsConstructors";

// export interface SceneWrapperArgs extends SceneArgs {
//     constructors: ToolsAndElementsConstructors;
//     matrix?: readonly number[];
//     elements?: SceneElement[];
// }

// export class SceneWrapper {
//     private static getInversedMatrix(matrix: readonly number[]): number[] {
//         const det =
//             matrix[0] * (matrix[4] * matrix[8] - matrix[7] * matrix[5]) -
//             matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
//             matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);

//         return [
//             (matrix[4] * matrix[8] - matrix[7] * matrix[5]) / det,
//             (matrix[2] * matrix[7] - matrix[1] * matrix[8]) / det,
//             (matrix[1] * matrix[5] - matrix[2] * matrix[4]) / det,
//             (matrix[5] * matrix[6] - matrix[3] * matrix[8]) / det,
//             (matrix[0] * matrix[8] - matrix[2] * matrix[6]) / det,
//             (matrix[3] * matrix[2] - matrix[0] * matrix[5]) / det,
//             (matrix[3] * matrix[7] - matrix[6] * matrix[4]) / det,
//             (matrix[6] * matrix[1] - matrix[0] * matrix[7]) / det,
//             (matrix[0] * matrix[4] - matrix[3] * matrix[1]) / det,
//         ];
//     }

//     elements = new Map<number, SceneElement>();
//     pens = new Map<number, PenTool>();
//     brushes = new Map<number, BrushTool>();

//     matrix: readonly number[];
//     invMatrix: readonly number[];

//     scene: Scene;

//     constructor(args: SceneWrapperArgs) {
//         if (args.matrix) {
//             if (args.matrix.length !== 9) throw Error("Матрица должна иметь 9 элементов");
//             this.matrix = args.matrix;
//             this.invMatrix = SceneWrapper.getInversedMatrix(args.matrix);
//         } else {
//             this.matrix = this.invMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
//         }
//         this.scene = new args.constructors.scene(args);
//     }

//     setMatrix(matrix: readonly number[]) {
//         this.matrix = matrix;
//         this.invMatrix = SceneWrapper.getInversedMatrix(matrix);
//     }
// }

import { EventSubscriber } from "stratum/common/types";
import { VDRSource } from "stratum/fileFormats/vdr";
import { SuperMap } from "stratum/helpers/superMap";
import { Project } from "stratum/project";
import { ViewContainerController } from "stratum/stratum";
import { Scene, SceneElement } from "./scene/scene";
import { BrushTool } from "./scene/tools/brushTool";
import { FontTool } from "./scene/tools/fontTool";
import { ImageTool } from "./scene/tools/imageTool";
import { PenTool } from "./scene/tools/penTool";
import { StringTool } from "./scene/tools/stringTool";
import { TextTool } from "./scene/tools/textTool";

export interface SceneWrapper {
    prj: Project;
    objects: Map<number, SceneElement>;
    pens: Map<number, PenTool>;
    brushes: Map<number, BrushTool>;
    dibs: Map<number, ImageTool>;
    doubleDibs: Map<number, ImageTool>;
    fonts: Map<number, FontTool>;
    strings: Map<number, StringTool>;
    texts: Map<number, TextTool>;
    matrix: readonly number[] | null;
    invMatrix: readonly number[] | null;
    scene: Scene;
    scale: number;
    wnd: ViewContainerController;
    wname: string;
    handle: number;
    title: string;
    source: VDRSource | null;

    windowMoveSubs: Set<EventSubscriber>;
    spaceDoneSubs: Set<EventSubscriber>;
    sizeSubs: Set<EventSubscriber>;

    controlNotifySubs: SuperMap<EventSubscriber, SceneElement | null>;
    mouseMoveSubs: SuperMap<EventSubscriber, SceneElement | null>;
    leftButtonUpSubs: SuperMap<EventSubscriber, SceneElement | null>;
    leftButtonDownSubs: SuperMap<EventSubscriber, SceneElement | null>;
    rightButtonUpSubs: SuperMap<EventSubscriber, SceneElement | null>;
    rightButtonDownSubs: SuperMap<EventSubscriber, SceneElement | null>;
    middleButtonUpSubs: SuperMap<EventSubscriber, SceneElement | null>;
    middleButtonDownSubs: SuperMap<EventSubscriber, SceneElement | null>;
    keyDownSubs: Set<EventSubscriber>;
    keyUpSubs: Set<EventSubscriber>;
    keyCharSubs: Set<EventSubscriber>;
}
