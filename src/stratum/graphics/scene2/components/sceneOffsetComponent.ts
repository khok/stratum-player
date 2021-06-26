export class SceneOffsetComponent {
    changed: boolean = true;
    constructor(private ox: number, private oy: number) {}
    x(): number {
        return this.ox;
    }

    y(): number {
        return this.oy;
    }

    set(x: number, y: number): void {
        this.ox = x;
        this.oy = y;
        this.changed = true;
    }
}
