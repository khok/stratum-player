declare module "internal-graphic-types" {
    /**
     * Загрузчик изображений.
     */
    export interface ImageResolver {
        fromData(data: string): HTMLImageElement;
        fromFile(filename: string): HTMLImageElement;
    }
}
