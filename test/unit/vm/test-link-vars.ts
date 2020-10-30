import { unzip } from "stratum/api";
import { Player } from "stratum/player";
import { build } from "stratum/schema/build";
const { strictEqual } = chai.assert;

async function load(name: string) {
    const [a1, a2] = await Promise.all(
        [`/projects/${name}.zip`, "/data/library.zip"].map((s) =>
            fetch(s)
                .then((r) => r.blob())
                .then(unzip)
        )
    );
    const prj = (await a1.mount(a2).project({ additionalClassPaths: ["library"] })) as Player;
    return build(prj.rootClassName, prj["res"].classes).createMemoryManager();
}

it("Корректно проводятся связи", async () => {
    const [balls, balls2] = await Promise.all([load("balls"), load("balls_stress_test")]);
    //минус 3 под зарезервированные поля в начале.
    strictEqual(balls.defaultDoubleValues.length + balls.defaultLongValues.length + balls.defaultStringValues.length - 3, 1235);
    strictEqual(balls2.defaultDoubleValues.length + balls2.defaultLongValues.length + balls2.defaultStringValues.length - 3, 2328);
}).timeout(10000);
