import readStratumVectorDraw from "./Reader";
import { GraphicElement } from "../graphicElements";

type HandleMap<T> = Map<number, T>;

type VectorDraw = Readonly<{
    topLeft: Readonly<{ x: number; y: number }>;
    brushHandle?: number;
    brushes?: HandleMap<Readonly<{ color: string; style: number }>>;
    pens?: HandleMap<Readonly<{ color: string; style: number; width: number; rop2: number }>>;
    imageSources?: HandleMap<string>;
    fonts?: HandleMap<Readonly<{ OldLogfont: any; fontSize: number }>>;
    strings?: HandleMap<string>;
    texts?: HandleMap<
        Readonly<{
            ltFgColor: string;
            ltBgColor: string;
            fontHandle: number;
            stringHandle: number;
        }>
    >;
}>;

type SchemeFields = {
    elements: HandleMap<GraphicElement>;
    elementOrder: number[];
    composed: boolean;
};

type StratumScheme = VectorDraw & Readonly<SchemeFields>;

type MutableStratumScheme = VectorDraw & SchemeFields;

type StratumImage = VectorDraw & {
    readonly elements: HandleMap<GraphicElement>;
    readonly elementOrder: readonly number[];
};

export { MutableStratumScheme, StratumScheme, StratumImage, readStratumVectorDraw };
