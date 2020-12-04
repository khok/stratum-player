import { unzip } from "stratum/api";
import { Player } from "stratum/player";
import { Schema } from "stratum/schema";
import { Enviroment } from "stratum/translator";
const { strictEqual } = chai.assert;

async function load(name: string) {
    const [a1, a2] = await Promise.all(
        [`/projects/test_${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(unzip)
        )
    );
    const prj = (await a1.merge(a2).project({ additionalClassPaths: ["library"] })) as Player;
    const env = new Enviroment();
    return env.init(Schema.build(prj["prjInfo"].rootClassName, prj["classes"], env).createTLB());
}

it("Корректно проводятся связи", async () => {
    const [balls, balls2] = await Promise.all([load("balls"), load("many_balls")]);
    //минус 3 под зарезервированные поля в начале.
    strictEqual(balls.newFloats.length + balls.newInts.length + balls.newStrings.length - 3, 1235);
    strictEqual(balls2.newFloats.length + balls2.newInts.length + balls2.newStrings.length - 3, 2328);
}).timeout(10000);
