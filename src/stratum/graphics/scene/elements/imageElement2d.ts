import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { VisibilityComponent } from "../components/visibilityComponent";
import { Scene } from "../scene";
import { ImageTool } from "../tools/imageTool";
import { Element2D, Element2DArgs } from "./element2d";

export interface ImageElement2DArgs extends Element2DArgs {
    visib?: VisibilityComponent;
    crop?: ImageCropArea;
}

export interface ImageCropArea {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
}

export class ImageElement2D extends Element2D {
    readonly type = "image";
    readonly visib: VisibilityComponent;

    _crop: ImageCropArea | null;
    _cropVer = 0;

    readonly image: ToolKeeperComponent<ImageTool>;

    constructor(scene: Scene, readonly isTransparent: boolean, tool: ImageTool, args: ImageElement2DArgs = {}) {
        super(scene, args);
        this._crop = args.crop ?? null;

        this._updateBBox(args.x ?? 0, args.y ?? 0, args.width ?? tool.width(), args.height ?? tool.height());
        this._parent?._recalcBorders();

        this.visib = args.visib ?? new VisibilityComponent(scene, true, 0);
        this.image = new ToolKeeperComponent(scene, tool);
    }

    cropArea(): ImageCropArea | null {
        return this._crop;
    }

    setCropArea(crop: ImageCropArea): this {
        this._crop = crop;
        ++this._cropVer;
        return this;
    }
}
