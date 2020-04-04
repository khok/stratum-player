import { VmStateContainer, Operation } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

function CreatePolyLine2d(ctx: VmStateContainer, coordCount: number) {
    const pointCount = coordCount / 2;
    const points = new Array(pointCount);
    for (let i = pointCount - 1; i >= 0; i--) points[i] = { y: ctx.stackPop() as number, x: ctx.stackPop() as number };
    const brushHandle = ctx.stackPop() as number;
    const penHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.createLine(points, penHandle, brushHandle).handle : 0);
}

// CreateLine2d(~HSpace, ~HPen, #0, ~xx, ~yy)
function CreateLine2d(ctx: VmStateContainer) {
    CreatePolyLine2d(ctx, 2);
}

// FLOAT CreateGroup2d(HANDLE HSpace, [HANDLE HObject]...)
function CreateGroup2d(ctx: VmStateContainer, objectCount: number) {
    const objects = new Array<number>(objectCount);
    for (let i = objectCount - 1; i >= 0; i--) objects[i] = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const space = ctx.windows.getSpace(spaceHandle);
    if (space) {
        const group = space.createGroup(objects);
        if (group) {
            ctx.stackPush(group.handle);
            return;
        }
    }
    ctx.stackPush(0);
}

//HANDLE CreateBitmap2d(HANDLE HSpace, HANDLE HDib, FLOAT x, FLOAT y)
function CreateBitmap2d(ctx: VmStateContainer) {
    const y = ctx.stackPop() as number;
    const x = ctx.stackPop() as number;
    const bitmapToolHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.createBitmap(x, y, bitmapToolHandle).handle : 0);
}

// FLOAT DeleteObject2d(HANDLE HSpace, HANDLE HObject)
function DeleteObject2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.deleteObject(objectHandle) : 0);
}

export function initGraphicObjects(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.CREATEPOLYLINE2D, CreatePolyLine2d as Operation);
    addOperation(Opcode.CREATELINE2D, CreateLine2d);
    addOperation(Opcode.CREATEGROUP2D, CreateGroup2d as Operation);
    addOperation(Opcode.CREATEBITMAP2D, CreateBitmap2d);
    addOperation(Opcode.DELETEOBJECT2D, DeleteObject2d);
}
