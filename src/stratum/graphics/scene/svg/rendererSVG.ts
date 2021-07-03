import { SmoothExecutor } from "stratum/common/computers";
import { Scene, SceneArgs } from "../scene";
import { LineSVG } from "./lineSVG";

export type PrimaryElementSVG = LineSVG;

export class RendererSVG extends Scene {
    private static updater = new SmoothExecutor();
    private static wins = new Set<RendererSVG>();
    private static redrawAll(): boolean {
        RendererSVG.wins.forEach((w) => w.render());
        return RendererSVG.wins.size > 0;
    }

    private lastElementsVer = -1;

    // private primaryMap = new WeakMap<PrimaryElement, PrimaryElementSVG>();
    private order: PrimaryElementSVG[] = [];

    private rect: DOMRect | null = null;

    readonly view: SVGSVGElement;

    constructor(args: SceneArgs) {
        super(args);
        this.view = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.view.style.setProperty("width", "100%");
        this.view.style.setProperty("height", "100%");
        RendererSVG.wins.add(this);
        RendererSVG.updater.run(RendererSVG.redrawAll);
    }

    // private createOrder(elements: readonly PrimaryElementSVG[]): PrimaryElementSVG[] {
    //     let doc: DocumentFragment | null = null;
    //     const order = elements.map<PrimaryElementSVG>((cur) => {
    //         const cur = this.primaryMap.get(cur);
    //         if (cur) return cur;
    //         let p: PrimaryElementSVG;
    //         switch (cur.type) {
    //             case "line":
    //                 p = new LineRendererSVG(cur);
    //                 break;
    //             default:
    //                 throw Error(`Неизвестный тип: ${cur.type}`);
    //         }
    //         if (!doc) {
    //             doc = document.createDocumentFragment();
    //         }
    //         this.primaryMap.set(cur, p);
    //         this.order.push(p);
    //         doc.appendChild(p._svg);
    //         return p;
    //     });
    //     if (doc) this.root.appendChild(doc);
    //     return order;
    // }

    private createOrder(elements: readonly PrimaryElementSVG[]): PrimaryElementSVG[] {
        let doc: DocumentFragment | null = null;
        const order = elements.map<PrimaryElementSVG>((cur) => {
            if (cur._svg.parentElement) return cur;
            if (!doc) {
                doc = document.createDocumentFragment();
            }
            this.order.push(cur);
            doc.appendChild(cur._svg);
            return cur;
        });
        if (doc) this.view.appendChild(doc);
        return order;
    }

    private static reoder(root: SVGSVGElement, prevOrder: PrimaryElementSVG[], newOrder: PrimaryElementSVG[]): void {
        prevOrder.forEach((prev, prevIndex) => {
            // Новый индекс элемента.
            const newIndex = newOrder.indexOf(prev);
            // Его нет, элемент удален.
            if (newIndex < 0) {
                prev._svg.remove();
                return;
            }

            // Если элемент был последним.
            if (prevIndex === prevOrder.length - 1) {
                // Если элемент так и остался последним, ничего не делаем.
                if (newIndex === newOrder.length - 1) return;
                // Если же нет, переставляем на нужное место.
                root.insertBefore(prev._svg, newOrder[newIndex + 1]._svg);
                return;
            }
            // Элемент не был последим.

            // Элемент стал последним, перемещаем в конец.
            if (newIndex === newOrder.length - 1) {
                root.appendChild(prev._svg);
                return;
            }

            const prev2 = prevOrder[prevIndex + 1];
            const cur2 = newOrder[newIndex + 1];

            if (prev2 === cur2) return;
            root.insertBefore(prev._svg, cur2._svg);
        });
    }

    render(): this {
        this.rect = null;
        const els = this._elements as PrimaryElementSVG[];
        if (this.lastElementsVer !== this._elementsVer) {
            this.lastElementsVer = this._elementsVer;

            const newOrder = this.createOrder(els);
            // console.log(newOrder.map((e) => e.handle));
            RendererSVG.reoder(this.view, this.order, newOrder);
            this.order = newOrder;
        }

        els.forEach((e) => e.render(this._offsetX, this._offsetY));
        return this;
    }

    elementAtPoint(x: number, y: number): PrimaryElementSVG | null {
        if (!this.rect) {
            this.rect = this.view.getBoundingClientRect();
        }
        const clientX = this.rect.left + x - this._offsetX;
        const clientY = this.rect.top + y - this._offsetY;
        const el = document.elementFromPoint(clientX, clientY);
        return (el && this.order.find((e) => e._svg === el)) || null;
    }
}
