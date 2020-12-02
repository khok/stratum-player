import { options, setLogLevel, unzip } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { SceneWindow } from "stratum/graphics/sceneWindow";
import { SimpleWs } from "stratum/player/ws";
import { VFSFile } from "stratum/vfs";

// Просмотр схемы или изображения имиджа.
export async function showScheme(name: string, { className, image }: { className?: string; image?: boolean } = {}) {
    setLogLevel("full");
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

    const clsFiles = [...a1.merge(a2).files(/.+\.cls$/i)];
    const pr = await Promise.all(clsFiles.map((f) => (f as VFSFile).readAs("cls")));
    const classes = new ClassLibrary(pr);

    const target = className || prjInfo.rootClassName;
    const vdr = image ? classes.get(target)?.image : classes.getComposedScheme(target);
    console.dir(vdr);
    const wnd = new SceneWindow({ handle: 0, attribute: "", wname: "", vdr, host: new SimpleWs(document.getElementById("main_window_container")!) });
    (function cb() {
        wnd.redraw();
        requestAnimationFrame(cb);
    })();
}
