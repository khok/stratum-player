import { options, unzip } from "stratum/api";
import { WindowWrapper } from "stratum/graphics/html";
import { Scene } from "stratum/graphics/scene";
import { Player } from "stratum/player";
import { VFSFile } from "stratum/vfs";

// Просмотр схемы или изображения имиджа.
export async function showScheme(name: string, { className, image }: { className?: string; image?: boolean } = {}) {
    options.iconsLocation = "./data/icons";

    const [a1, a2] = await Promise.all(
        [`/projects/${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(unzip)
        )
    );

    const prjFile = a1.files(/.+\.(prj|spj)$/i).next().value as VFSFile;
    const prjInfo = await prjFile.readAs("prj");
    const dir = prjFile.parent;

    const clsFiles = [...a1.merge(a2).files(/.+\.cls$/i)];
    const classes = await Promise.all(clsFiles.map((f) => (f as VFSFile).readAs("cls")));

    const target = className || prjInfo.rootClassName;
    const pl = new Player({ classes, dir, prjInfo });
    const vdr = image ? pl.getClass(target)?.image : pl.getComposedScheme(target);
    new Scene({ handle: 0, vdr, renderer: new WindowWrapper(document.getElementById("main_window_container")!).renderer });
    console.dir(vdr);
}
