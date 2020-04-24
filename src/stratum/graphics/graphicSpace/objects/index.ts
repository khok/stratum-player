import { GroupObject, GroupObjectOptions } from "./groupObject";
import { BitmapObject, BitmapObjectOptions } from "./objects2d/bitmapObject";
import { ControlObject, ControlObjectOptions } from "./objects2d/controlObject";
import { LineObject, LineObjectOptions } from "./objects2d/lineObject";
import { TextObject, TextObjectOptions } from "./objects2d/textObject";

export { LineObject, LineObjectOptions };
export { TextObject, TextObjectOptions };
export { BitmapObject, BitmapObjectOptions };
export { ControlObject, ControlObjectOptions };
export { GroupObject, GroupObjectOptions };

export type GraphicObject = LineObject | TextObject | BitmapObject | ControlObject | GroupObject;
