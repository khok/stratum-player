export type EventType = "WINDOW_CREATED";

export class EventDispatcher {
    subs: { event: EventType; fn: (...data: any) => void }[] = [];
    dispatch(event: EventType, ...data: any) {
        this.subs.forEach(s => {
            if (s.event === event) s.fn(...data);
        });
    }
    on(event: EventType, fn: (...data: any) => void) {
        this.subs.push({ event, fn });
    }
}
