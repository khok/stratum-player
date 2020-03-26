declare module "internal-graphic-types" {
    import { BmpImage } from "data-types-graphics";

    export type ImageToolData =
        | { type: "ttDIB2D" | "ttDOUBLEDIB2D"; image: BmpImage }
        | { type: "ttREFTODIB2D" | "ttREFTODOUBLEDIB2D"; filename: string };
    /**
     * Загрузчик изображений.
     */
    export interface ImageResolver {
        fromProjectFile(bmpFilename: string): HTMLImageElement;
        loadImage(data: ImageToolData): HTMLImageElement;
    }

    export interface HtmlTextInputWrapperOptions {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        text?: string;
        hidden?: boolean;
    }

    export interface HtmlTextInputWrapper extends Readonly<Required<HtmlTextInputWrapperOptions>> {
        set(options: HtmlTextInputWrapperOptions): HtmlTextInputWrapper;
        destroy(): void;
        onChange(fn: () => void): void;
    }

    export interface HTMLInputElementsFactory {
        createTextInput(options: HtmlTextInputWrapperOptions): HtmlTextInputWrapper;
    }
}
