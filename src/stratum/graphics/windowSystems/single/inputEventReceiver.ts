export interface InputEventReceiver {
    handleEvent(data: { x: number; y: number; buttons: number; button: number }, type: "down" | "up" | "move"): void;
    //подписки на события от пользователя (клик мышью, изменение html текстбоксов)
    subscribeToMouseEvents(callback: (code: number, buttons: number, x: number, y: number) => void): void;
    subscribeToControlEvents(callback: (code: number, controlHandle: number) => void): void;
}
