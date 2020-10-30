// import { Renderer } from "../scene/interfaces";
// import { InputEventReceiver } from "../windowSystems/single/inputEventReceiver";

// export interface RendererWindow {
//     readonly name: string;
//     readonly renderer: Renderer & InputEventReceiver;

//     readonly originX: number;
//     readonly originY: number;
//     setOrigin(x: number, y: number): void;
//     originChanged?: (x: number, y: number) => void;

//     readonly width: number;
//     readonly height: number;
//     setSize(width: number, height: number): void;
//     sizeChanged?: (x: number, y: number) => void;

//     close(): void;
// }

// export interface WindowSystem {
//     readonly screenWidth: number;
//     readonly screenHeight: number;
//     readonly areaOriginX: number;
//     readonly areaOriginY: number;
//     readonly areaWidth: number;
//     readonly areaHeight: number;

//     createWindow(name: string): RendererWindow;
// }
