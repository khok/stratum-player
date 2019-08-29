// import { StratumImage } from "./deserializers";
// import SchemeInstance from "./schemeInstance";

// // HSpace := OpenSchemeWindow(~WindowName,~ClassName,"WS_BYSPACE|"+~Flags) //HANDLE
// // x:=GetScreenWidth()/2-~Width/2
// // y:=GetScreenHeight()/2-~Height/2
// // x:=GetWorkAreaX() + GetWorkAreaWidth()/2-~Width/2
// // GetWorkAreaWidth()
// // y:=GetWorkAreaY() + GetWorkAreaHeight()/2-~Height/2
// // GetWorkAreaHeight()

// export default class WindowSystem {
//     private spaces: SchemeInstance[];
//     private windows: { [name: string]: Window };
//     private canvas?: HTMLCanvasElement;
//     constructor(private areaSize: { x: number; y: number }, private multiwindow: boolean) {
//         this.windows = {};
//         this.spaces = [];
//         this.multiwindow = multiwindow;
//     }

//     setTargetCanvas(canvas: HTMLCanvasElement) {
//         if (this.multiwindow) throw new Error("Не используется при мультиоконности");
//         this.canvas = canvas;
//     }

//     openScheme(windowName: string, className: string, flags: string) {
//         console.log(`openSchemeWindow(${windowName}, ${className}, ${flags})`);
//         if (!this.multiwindow && !this.canvas) throw new Error("Canvas не назначен!");

//         if (this.windows[windowName]) throw new Error(`Окно с именем ${windowName} уже создано`);

//         const classInfo = this.classLib[className];
//         if (!classInfo || !classInfo.scheme) {
//             console.warn(`Класс ${className} не найден или не имеет схемы`);
//             return 0;
//         }

//         if (!this.multiwindow) document.title = windowName;

//         const { scheme, childs } = classInfo;

//         if (!scheme.composed && childs) composeScheme(scheme, childs, this.classLib);

//         const spaceHandle = this.spaces.length + 1;
//         const win = new Window(windowName, flags, this.canvas);
//         const space = new SchemeInstance(<StratumImage>scheme, win.canvas);
//         win.setSchemeInstance(space);

//         this.spaces[spaceHandle] = space;
//         this.windows[windowName] = win;
//         return spaceHandle;
//     }

//     getWindow(windowName: string) {
//         return this.windows[windowName];
//     }

//     getSpace(spaceHandle: number) {
//         return this.spaces[spaceHandle];
//     }

//     get workAreaTopLeft() {
//         return { x: 0, y: 0 };
//     }

//     get workAreaSize() {
//         return this.areaSize;
//     }

//     get screenSize() {
//         return this.workAreaSize;
//     }
// }
