export { SceneBitmapObject, SceneBitmapObjectArgs } from "./objects2d/sceneBitmapObject";
export { SceneControlObject, SceneControlObjectArgs } from "./objects2d/sceneControlObject";
export { SceneLineObject, SceneLineObjectArgs } from "./objects2d/sceneLineObject";
export { SceneTextObject, SceneTextObjectArgs } from "./objects2d/sceneTextObject";
export { SceneGroupObject, SceneGroupObjectArgs } from "./sceneGroupObject";

import { SceneBitmapObject, SceneControlObject, SceneGroupObject, SceneLineObject, SceneTextObject } from ".";

export type SceneObject2d = SceneLineObject | SceneTextObject | SceneBitmapObject | SceneControlObject;
export type SceneObject = SceneObject2d | SceneGroupObject;
