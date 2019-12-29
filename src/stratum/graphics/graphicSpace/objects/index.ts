import { GroupObject } from "./groupObject";
import { ControlObject } from "./objects2d/controlObject";
import { LineObject } from "./objects2d/lineObject";
import { BitmapObject } from "./objects2d/bitmapObject";
import { DoubleBitmapObject } from "./objects2d/doubleBitmapObject";

export { GroupObject };
export { ControlObject };
export { LineObject };
export { BitmapObject };
export { DoubleBitmapObject };
export type GraphicObject = GroupObject | ControlObject | LineObject | BitmapObject | DoubleBitmapObject;
