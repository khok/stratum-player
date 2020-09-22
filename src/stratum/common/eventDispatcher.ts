/*
 * Простейший "рассыльщик" (лол) сообщений.
 * Сообщения возникают в ходе работы виртуалки. На клиентской стороне используется,
 * например, для изменения document.title при создании окна.
 */

export interface EventType {
    WINDOW_CREATED: (name: string) => void;
    PROJECT_STOPPED: () => void;
    VM_ERROR: (error: string) => void;
}

export class EventDispatcher {
    private subs = new Map<keyof EventType, (...data: any) => void>();
    dispatch<T extends keyof EventType>(event: T, ...data: Parameters<EventType[T]>) {
        const sub = this.subs.get(event);
        if (sub) sub(...data);
    }
    on<T extends keyof EventType>(event: T, fn: EventType[T]) {
        this.subs.set(event, fn);
    }
}
