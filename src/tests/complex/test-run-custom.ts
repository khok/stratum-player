import { fromFileList, loadLibraryFromUrl } from "~/api";

const stdlibPromise = loadLibraryFromUrl("/data/library.zip");

async function playProject({ target }: Event) {
    const fList = (target as HTMLInputElement).files;
    if (!fList) return;
    const stdLib = await stdlibPromise;
    console.log("Стандартная библиотека имиджей загружена");
    fromFileList(fList, { preloadedLibs: stdLib })
        .then(player => {
            if (!player) return;
            player.setGraphicOptions({ globalCanvas: cnv });
            return player.play();
        })
        .catch(e => {
            console.error(e);
            alert("Возникли ошибки, см. в консоли (F12)");
        });
    const cnv = document.createElement("canvas");
    cnv.setAttribute("id", "canvas");
    cnv.setAttribute("style", "border:1px solid #000000;");
    cnv.setAttribute("width", (window.innerWidth - 40).toString());
    cnv.setAttribute("height", (window.innerHeight - 40).toString());
    document.getElementById("input")!.replaceWith(cnv);
}

window.onload = () => {
    const input = document.createElement("input");
    input.setAttribute("id", "input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", ".zip");
    input.addEventListener("change", playProject);
    document.getElementById("root")!.replaceWith(input);
};
