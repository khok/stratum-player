import { Enviroment } from "stratum/enviroment";
import { Project } from "stratum/project";
import { ZipFS } from "stratum/stratum";
import { RealZipFS } from "zipfs/realZipfs";
const { strictEqual } = chai.assert;

const find = (fs: ZipFS) => {
    const res = [...fs.files(/.+\.(prj|spj)$/i)];
    if (res.length === 0) throw Error("Не найдено несколько файлов проектов");
    if (res.length > 1) throw Error(`Найдено несколько файлов проектов: ${res.join(";\n")}`);
    return res[0];
};

async function load(name: string) {
    const [a1, a2] = await Promise.all(
        [`/projects/test_${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(RealZipFS.create)
        )
    );
    const f = find(a1);
    a1.merge(a2);
    const res = await Enviroment.loadProject(f, [{ dir: a1.path("library") }]);
    return new Project({} as Enviroment, res);
}

it("Корректно проводятся связи", async () => {
    const [balls, balls2] = await Promise.all([load("balls"), load("many_balls")]);
    //минус 3 под зарезервированные поля в начале.
    strictEqual(balls.newFloats.length + balls.newInts.length + balls.newStrings.length - 3, 1235);
    strictEqual(balls2.newFloats.length + balls2.newInts.length + balls2.newStrings.length - 3, 2328);
}).timeout(10000);
