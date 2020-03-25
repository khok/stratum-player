import { readProjectData, openZipFromUrl, ReadOptions } from "~/fileReader/fileReaderHelpers";
import { GraphicSpace } from "~/graphics/graphicSpace/graphicSpace";
import { SimpleImageLoader } from "~/graphics/graphicSpace/simpleImageLoader";
import { FabricScene } from "~/graphics/renderers/fabricRenderer/fabricScene";
import { createComposedScheme } from "~/helpers/graphics";
import { HtmlFactory } from "~/helpers/htmlFactory";

//Запуск проекта `name` с использованием api.ts
export async function _show_scheme(name: string, opts: ReadOptions) {
    const zipFiles = await openZipFromUrl([`test_projects/${name}.zip`, "/data/library.zip"]);
    const { collection, rootName } = await readProjectData(zipFiles, opts);

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const htmlRoot = document.getElementById("root")!;

    const root = collection.get(rootName)!;
    const scheme = createComposedScheme(root.scheme!, root.childs!, collection);

    const inputFactory = new HtmlFactory(htmlRoot);
    const scene = new FabricScene({ canvas, inputFactory });
    const imageResolver = new SimpleImageLoader("data/icons");
    GraphicSpace.fromVdr("", scheme, imageResolver, scene);
    imageResolver.allImagesLoaded.then(() => scene.forceRender());
    // scene.render();
}
