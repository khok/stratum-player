/* Всякие достаточно независимые от предметной области типы.
 * В частности, здесь валяется Point2D, который хрен пойми куда еще положить.
 */

export interface Point2D {
    x: number;
    y: number;
}

export type DibToolImage = CanvasRenderingContext2D | null;
