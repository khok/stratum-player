/*
 * Всякие utility types, которые почему-то не удосужились добавить в поставку тайпскрипта.
 */

// export type PartialRequiredData<T, K extends keyof T> = Partial<Omit<T, "type">> & Pick<T, K>;
// export type PartialOptionalData<T, K extends keyof T> = Partial<Omit<T, "type">> & Omit<T, K | "type">;

/**
 * Делает часть полей обязательными.
 *
 * `Require<{ source: string; elements? : Element[], tools? : Tool[] }, "elements">` -> `{ source: string; elements : Element[], tools? : Tool[] }`
 */
export type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;

/**
 * Делает часть полей необязательными.
 *
 * `Optional<{ size: Point2D; imageSize: Point2D }, "imageSize">` -> `{ size: Point2D; imageSize?: Point2D }`
 */
export type Optional<T, K extends keyof T> = Partial<T> & Omit<T, K>;

/**
 * Удаляет указанные поля.
 *
 * `Remove<{ size : number, type: "Image" }, "type">` -> `{ size : number }`
 */
export type Remove<T, K extends keyof T> = Omit<T, K>;
