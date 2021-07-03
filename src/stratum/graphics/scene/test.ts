import { LineElement2D } from "./elements/lineElement2d";
import { BrushSVG } from "./svg/brushSVG";
import { parseColorRef } from "./svg/colorrefParsers";
import { PenSVG } from "./svg/penSVG";
import { RendererSVG } from "./svg/rendererSVG";

window.addEventListener("load", () => {
    console.log("loaded");
    const root = document.getElementsByTagName("svg")[0];
    const scene = new RendererSVG(root);

    const coords: number[] = (() => {
        let c: number[] = [];
        var alpha = (2 * Math.PI) / 10;
        var radius = 120;
        var starXY = [100, 100];

        for (var i = 11; i != 0; i--) {
            var r = (radius * ((i % 2) + 1)) / 2;
            var omega = alpha * i;

            c.push(r * Math.sin(omega) + starXY[0], r * Math.cos(omega) + starXY[1]);
        }
        return c;
    })();
    const pen = scene.pen({ handle: 0, color: parseColorRef("rgb(0,0,0)"), rop: 0, style: 0, width: 5 });
    const brush = scene.brush({ handle: 0, color: parseColorRef("rgb(100,100,0)"), rop: 0, style: 0, hatch: 0 });

    const elements: LineElement2D[] = [];
    for (let i = 0; i < 50; ++i) {
        const pen = scene.pen({ handle: 0, color: parseColorRef("rgb(0,0,0)"), rop: 0, style: 0, width: i * 5 });
        const line = scene.line(coords, { handle: i, brush, pen, layer: 2 ** i });
        line.move(line.x() + i * 30, line.y() + i * 30);
        elements.push(line);
        // rend["_svg"].addEventListener("pointermove", () => console.log("over"));
        // rend["_svg"].style.cursor = "pointer";
    }

    elements.push(scene.line([100, 100, 200, 200], { handle: 10, pen }));

    const pen2 = new PenSVG(scene, { handle: 0, color: parseColorRef("rgb(100,100,0)"), rop: 0, style: 0, width: 4 });
    const brush2 = new BrushSVG(scene, { handle: 0, color: parseColorRef("rgb(100,0,0)"), rop: 0, style: 0, hatch: 0 });

    // const elements2: LineElement2D[] = [];
    // for (let i = 0; i < 10; ++i) {
    //     const line = new LineElement2D(scene, coords, { handle: 0, pen: pen2, brush: brush2 });
    //     line.move(line.x() + Math.random() * 200, line.y() + Math.random() * 200);
    //     elements2.push(line);
    // }

    // const group = new GroupElement2D(scene, { handle: 0 });
    // const gline = new LineElement2D(scene, [0, 0, 0, 0, 0, 0, 0, 0], { handle: 0, pen: pen2, brush: brush2 });

    // group.setChildren(elements2);
    // rends.unshift(glner);

    // const ctx = document.getElementsByTagName("canvas")[0].getContext("2d")!;

    let sceneX = 0;
    let sceneY = 0;

    let capt = false;
    let prevX = 0;
    let prevY = 0;
    root.addEventListener("pointerdown", (evt) => {
        capt = true;
        prevX = evt.clientX;
        prevY = evt.clientY;
        const rect = root.getBoundingClientRect();
        const x = prevX - rect.x;
        const y = prevY - rect.y;

        // console.log(renderer.elementAtPoint(100 + rect.x, 100 + rect.y));

        // console.log(root.transform.baseVal);

        console.log(scene.elementAtPoint(100, 100)?.parent());
        // console.log(document.elementFromPoint(evt.clientX, evt.clientY));
    });
    window.addEventListener("pointermove", (evt) => {
        if (!capt) return;
        const dx = evt.clientX - prevX;
        const dy = evt.clientY - prevY;
        prevX = evt.clientX;
        prevY = evt.clientY;
        sceneX -= dx;
        sceneY -= dy;
    });

    window.addEventListener("pointerup", () => {
        capt = false;
    });

    let mp = 1.01;
    let count = 0;
    let visible = true;
    let prevTime: number | undefined = undefined;
    let sum = 0;
    let frameCount = 0;

    // scene.setElements(elements.concat(elements2, gline));
    // scene.setElements(elements);

    scene.setElements(elements);
    scene.render();

    setTimeout(() => {
        // const c = elements[elements.length - 1];
        // elements[elements.length - 1] = elements[0];
        // elements[0] = c;
        // scene.setElements([...elements.filter((e, i) => i !== 3), elements[3]]);
        // scene.render();
    }, 1000);

    (async function () {
        for (let i = 0; i < elements.length; ++i) {
            // const e2 = elements.slice(0, i);
            // scene.setElements(e2);
            scene.setLayers(2 ** i).render();
            await new Promise((res) => setTimeout(res, 100));
        }
    })();

    return;

    const f = (time: number) => {
        if (prevTime !== undefined) {
            sum += time - prevTime;
        }
        prevTime = time;
        if (++frameCount > 60) {
            console.log(sum / frameCount);
            sum = 0;
            frameCount = 0;
        }

        const els = scene.elements().slice();
        // const idx = els.indexOf(gline);
        // if (idx < 0) throw "";
        // if (idx > 0) {
        //     const to = idx - 1;
        //     const c = els[to];
        //     if (c) {
        //         els[to] = gline;
        //         els[idx] = c;
        //         scene.setElements(els);
        //     }
        // }
        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // group.rotate(group.x() + group.width() / 2, group.y() + group.height() / 2, 0.01);

        // elements2.forEach((line) => {
        //     return;
        //     line /*.move(line.x() + mp, line.y() + mp)*/.rotate(line.x() + line.width() / 2, line.y() + line.height() / 2, 0.05)
        //         .size(line.width() * mp, line.height() * mp);
        //     // rend.render(ctx, -400 + (i += mp), -400 + (i += mp));
        // });

        // gline
        //     .update(0, group.x(), group.y())
        //     .update(1, group.x() + group.width(), group.y())
        //     .update(2, group.x() + group.width(), group.y() + group.height())
        //     .update(3, group.x(), group.y() + group.height());

        scene.render();

        if (++count > 300) {
            mp = mp > 1 ? 1 / 1.01 : 1.01;
            // glner.line.visib.setVisible((visible = !visible));
            count = 0;
        }

        requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
});
