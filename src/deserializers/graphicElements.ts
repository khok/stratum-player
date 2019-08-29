type Point2D = Readonly<{ x: number; y: number }>;

type ElementBase = {
    readonly options: number;
    readonly name: string;
};

export type MutableGraphicElement = {
    options: number; //может меняться при композе
    readonly name: string;
};

export type Element2DBase = ElementBase & {
    readonly position: Point2D;
    readonly size: Point2D;
};

export type MutableGroup = ElementBase & {
    readonly type: "group";
    readonly items: number[]; //Также меняется при композе во время инсерта изображений
};

export type Group = ElementBase & {
    readonly type: "group";
    readonly items: readonly number[];
};

export type Line = Element2DBase &
    Readonly<{
        type: "line";
        penHandle: number;
        brushHandle: number;
        points: readonly Point2D[];
    }>;

export type Bitmap = Element2DBase & {
    readonly type: "bitmap";
    readonly data: Readonly<{
        origin: Point2D;
        size: Point2D;
        angle: number;
        sourceHandle: number;
    }>;
};

export type Text = Element2DBase &
    Readonly<{
        type: "text";
        textHandle: number;
        delta: number;
        angle: number;
    }>;

export type Control = Element2DBase & {
    readonly type: "control";
    readonly data: Readonly<{
        className: "Edit" | "Button" | "ComboBox";
        dwStyle: number;
        exStyle: number;
        id: number;
        size: Point2D;
        text: string;
    }>;
};
export type GraphicElement2D = Line | Bitmap | Text | Control;
export type GraphicElement = GraphicElement2D | Group;
