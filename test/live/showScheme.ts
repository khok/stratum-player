import { SimpleLibrary } from "stratum/classLibrary/simpleLibrary";
import { readClsFile } from "stratum/fileFormats/cls";
import { readPrjFile } from "stratum/fileFormats/prj";
import { SceneWindow } from "stratum/graphics/sceneWindow";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { options } from "stratum/options";
import { SimpleWs } from "stratum/player/ws";
import { ZipFS } from "stratum/stratum";
import { RealZipFS } from "zipfs/realZipfs";

// Просмотр схемы или изображения имиджа.
export async function showScheme(name: string, { className, image }: { className?: string; image?: boolean } = {}) {
    options.iconsLocation = "./data/icons";

    const [a1, a2]: ZipFS[] = await Promise.all(
        [`/projects/${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(RealZipFS.create)
        )
    );

    const prjs = [...a1.files(/.+\.(prj|spj)$/i)];
    const prj = await a1.arraybuffer(prjs[0]);
    const prjInfo = readPrjFile(new BinaryReader(prj!));
    const fs = a1.merge(a2);

    const files = await fs.searchClsFiles([fs.path("C:")], true).then((c) => fs.arraybuffers(c));
    const lib = new SimpleLibrary(files.map((c) => readClsFile(new BinaryReader(c!))));

    const target = className || prjInfo.rootClassName;
    const cl = lib.get(target);
    const vdr = image ? cl && cl["image"]() : cl?.scheme();
    console.dir(vdr);
    const host = new SimpleWs(document.getElementById("main_window_container")!);
    new SceneWindow({ handle: 1, wname: "test", attribs: {}, vdr }, host.window.bind(host));
}
