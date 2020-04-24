declare module "other-types" {
    export interface ProjectFile {
        filename: string;
        data: ArrayBuffer;
    }
    export type PartialRequiredData<T, K extends keyof T> = Partial<Omit<T, "type">> & Pick<T, K>;
    export type PartialOptionalData<T, K extends keyof T> = Partial<Omit<T, "type">> & Omit<T, K | "type">;
    export type NormalOmit<T, K extends keyof T> = Omit<T, K>;
}
