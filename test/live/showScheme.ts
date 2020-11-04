import { unzip } from "stratum/api";
import { createComposedScheme } from "stratum/common/createComposedScheme";
import { WindowWrapper } from "stratum/graphics/html";
import { Scene } from "stratum/graphics/scene";
import { VirtualFile } from "stratum/vfs";

// Просмотр схемы или изображения имиджа.
export async function showScheme(name: string, { className, image }: { className?: string; image?: boolean } = {}) {
    const [a1, a2] = await Promise.all(
        [`/projects/${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(unzip)
        )
    );

    const files = [...a1.merge(a2).search(/.+\.cls$/i)];
    const prj = await (a1.search(/.+\.(prj)|(spj)$/i).next().value as VirtualFile).readAs("prj");
    const mp = files.map((f) => (f as VirtualFile).readAs("cls"));
    const cls = new Map((await Promise.all(mp)).map((c) => [c.name.toUpperCase(), c]));

    const target = className || prj.rootClassName;
    const root = cls.get(target.toUpperCase());
    console.log(cls);
    if (!root) return console.log(`no ${target}`);

    const scheme =
        (image && root.image) ||
        (root.scheme && root.children ? createComposedScheme(root.scheme, root.children, cls) : root.scheme) ||
        root.image;
    if (!scheme) return console.log(`no scheme or image for ${target}`);
    new Scene({ handle: 0, vdr: scheme, renderer: new WindowWrapper(document.getElementById("main_window_container")!).renderer });
    console.dir(scheme);
}
