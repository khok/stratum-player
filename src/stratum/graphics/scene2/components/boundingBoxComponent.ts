export interface BoundingBoxComponent {
    /**
     * Минимальная координата по X.
     */
    minX(): number;
    /**
     * Минимальная координата по Y.
     */
    minY(): number;
    /**
     * Максимальная координата по X.
     */
    maxX(): number;
    /**
     * Максимальная координата по Y.
     */
    maxY(): number;
    /**
     * Ширина объекта.
     */
    width(): number;
    /**
     * Высота объекта.
     */
    height(): number;
    /**
     * Актуальная ширина объекта (применимо для текстов и битовых карт).
     */
    actualWidth(): number;
    /**
     * Актуальная высота объекта (применимо для текстов и битовых карт).
     */
    actualHeight(): number;

    /**
     * Угол поворота объекта.
     */
    angle(): number;

    onTransformMoved(dx: number, dy: number): void;
    onTransformScaled(ox: number, oy: number, dx: number, dy: number): void;
    onTransformRotated(ox: number, oy: number, angle: number): void;
}
