import { GroupObject } from "./groupObject";
import { ControlObject } from "./objects2d/controlObject";
import { LineObject } from "./objects2d/lineObject";
import { BitmapObject } from "./objects2d/bitmapObject";
import { TextObject } from "./objects2d/textObject";

export { GroupObject };
export { LineObject };
export { TextObject };
export { ControlObject };
export { BitmapObject };
export type GraphicObject = GroupObject | ControlObject | LineObject | TextObject | BitmapObject;
