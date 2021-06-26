export class ZOrderingComponent {
    bottom(): number {
        throw new Error("Method not implemented.");
    }
    top(): number {
        throw new Error("Method not implemented.");
    }
    add(handle: number): void {
        throw new Error("Method not implemented.");
    }
    changed: boolean = true;
    constructor(private ordering: readonly number[]) {}

    order(): readonly number[] {
        return this.ordering;
    }

    setOrder(order: readonly number[]) {
        this.ordering = order;
        this.changed = true;
    }
}
