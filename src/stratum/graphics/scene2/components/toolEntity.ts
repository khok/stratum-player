// import { BrushComponent } from "./brushComponent";
// import { PenComponent } from "./penComponent";
// import { ToolKeeperComponent } from "./toolKeeperComponent";

// export class ToolEntity {
//     private subs = new Set<ToolKeeperComponent>();
//     subscribe(sub: ToolKeeperComponent): void {
//         this.subs.add(sub);
//     }
//     unsubscribe(sub: ToolKeeperComponent): void {
//         this.subs.delete(sub);
//     }
//     subCount(): number {
//         return this.subs.size;
//     }

//     pen(): PenComponent | null {}

//     setPen(): void {
//         this.subs.forEach((c) => c.onToolChanged());
//     }

//     brush(): BrushComponent | null {}

//     setBrush(): void {
//         this.subs.forEach((c) => c.onToolChanged());
//     }
// }
