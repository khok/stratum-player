import { unzip, ws } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { readPrjFile } from "stratum/fileFormats/prj";
import { SimpleWindow } from "stratum/graphics/manager/simpleWindow";
import { BmpToolFactory, Scene } from "stratum/graphics/scene";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { parseBytecode } from "stratum/vm/parseBytecode";

// Просмотр схемы или изображения имиджа.
export async function showScheme(name: string, { className, image }: { className?: string; image?: boolean } = {}) {
    const [a1, a2] = await Promise.all(
        [`/projects/${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(unzip)
        )
    );

    const files = a1.mount(a2).search(/.+\.cls$/i);
    const prjFile = a1.search(/.+\.(prj)|(spj)$/i)[0];
    const mp = files.map((f) => f.arraybuffer().then((a) => new ClassProto(a, { bytecodeParser: parseBytecode, filepathDos: f.path })));
    const prj = readPrjFile(new BinaryStream(await prjFile.arraybuffer()));
    const cls = new Map((await Promise.all(mp)).map((c) => [c.name.toLowerCase(), c]));

    const target = className || prj.rootClassName;
    const root = cls.get(target.toLowerCase());
    console.log(cls);
    if (!root) return console.log(`no ${target}`);

    const scheme =
        (image && root.image) ||
        (root.scheme && root.children ? createComposedScheme(root.scheme, root.children, cls) : root.scheme) ||
        root.image;
    if (!scheme) return console.log(`no scheme or image for ${target}`);
    console.dir(scheme);

    // Создаем оконный хост.
    const globalCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;
    const wnd = ws({ globalCanvas, htmlRoot });

    const window = new SimpleWindow({ window: wnd.createWindow("") });
    new Scene({ handle: 0, vdr: scheme, window });
    BmpToolFactory.allImagesLoaded.then(() => wnd.redraw());
}
