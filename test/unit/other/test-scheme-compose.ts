import { Enviroment } from "stratum/enviroment";
import { VectorDrawingElement } from "stratum/fileFormats/vdr";
import { ZipFS } from "stratum/stratum";
import { RealZipFS } from "zipfs/realZipfs";
const { strictEqual } = chai.assert;

const find = (fs: ZipFS) => {
    const res = [...fs.files(/.+\.(prj|spj)$/i)];
    if (res.length === 0) throw Error("Не найдено несколько файлов проектов");
    if (res.length > 1) throw Error(`Найдено несколько файлов проектов: ${res.join(";\n")}`);
    return res[0];
};

function isElementInGroup(elements: VectorDrawingElement[], handle: number) {
    return elements.some((el) => el.type === "group" && el.childHandles.includes(handle));
}

function collect(elements: VectorDrawingElement[], element: VectorDrawingElement): unknown {
    const { handle } = element;
    const name = `${element.type} #${handle}${(element.name ?? "") && " "}${element.name ?? ""}`;
    if (element.type === "group")
        return {
            name,
            data: element.childHandles.map((h) => collect(elements, elements.find((el) => el.handle === h)!)),
        };
    return name;
}

function toJson(elements: VectorDrawingElement[]) {
    const topLevelElements = elements.filter((el) => !isElementInGroup(elements, el.handle));
    return topLevelElements.map((el) => collect(elements, el));
}

const test_result = JSON.stringify([
    { name: "group #2", data: ["doubleBitmap #1"] },
    { name: "group #5", data: ["doubleBitmap #3", "bitmap #4"] },
    "line #7 bkg",
    {
        name: "group #8",
        data: [
            "doubleBitmap #6",
            {
                name: "group #18",
                data: [
                    { name: "group #15", data: ["line #11", "line #13"] },
                    "line #16",
                    {
                        name: "group #17",
                        data: [{ name: "group #12 Nahui", data: ["line #10", "line #9"] }, "line #14"],
                    },
                ],
            },
        ],
    },
    "line #34",
    "line #35",
]);

it("Тестирует правильность считывания и композиции VDR", async () => {
    const [a1, a2] = await Promise.all(
        ["/projects/test_scheme_compose.zip", "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(RealZipFS.create)
        )
    );

    const f = find(a1);
    a1.merge(a2);
    const res = await Enviroment.loadProject(f, [{ dir: a1.path("library"), loadClasses: true }]);
    const scheme = res.classes.get(res.prjInfo.rootClassName)!.scheme();
    const elements = toJson(scheme!.elements!);
    strictEqual(JSON.stringify(elements), test_result);
});
