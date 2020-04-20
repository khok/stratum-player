import { openZipFromUrl, ReadOptions, readProjectData } from "~/fileReader/fileReaderHelpers";
import { BitmapToolFactory } from "~/graphics/graphicSpace/bitmapToolFactory";
import { GraphicSpace } from "~/graphics/graphicSpace/graphicSpace";
import { FabricScene } from "~/graphics/renderers/fabric/fabricScene";
import { createComposedScheme } from "~/helpers/graphics";
import { HtmlFactory } from "~/helpers/htmlFactory";

//Запуск проекта `name` с использованием api.ts
export async function _show_scheme(name: string, opts: ReadOptions) {
    const zipFiles = await openZipFromUrl([`test_projects/${name}.zip`, "/data/library.zip"]);
    const { classesData, rootName } = await readProjectData(zipFiles, opts);

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;

    const root = classesData.get(rootName)!;
    const scheme = createComposedScheme(root.scheme!, root.childInfo!, classesData);

    console.dir(scheme);
    const scene = new FabricScene({ canvas, inputFactory: new HtmlFactory(htmlRoot) });
    const bmpFactory = new BitmapToolFactory("data/icons");
    GraphicSpace.fromVdr("", scheme, bmpFactory, scene);
    bmpFactory.allImagesLoaded.then(() => scene.render());
}
