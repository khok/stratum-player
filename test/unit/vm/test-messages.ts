import { unzip } from "stratum/api";
import { Player } from "stratum/player";
import { Schema } from "stratum/schema";
import { Enviroment } from "stratum/translator";
const { ok } = chai.assert;

it("Тест SendMessage()", async () => {
    const fs = await fetch("/projects/test_messages.zip")
        .then((r) => r.blob())
        .then(unzip);
    const prj = (await fs.project({ additionalClassPaths: ["library"] })) as Player;
    const mem = new Enviroment();
    const schema = Schema.build(prj["prjInfo"].rootClassName, prj["classes"], mem);
    mem.init(schema.createTLB());
    schema.applyDefaults().applyVarSet(prj["stt"]!);
    mem.sync().assertZeroIndexEmpty();

    const ch1 = schema.child(2)!;
    ok(mem.newFloats[ch1.TLB[0]] === 0);
    ok(mem.newFloats[ch1.TLB[1]] === 21);

    schema.compute();
    mem.sync().assertZeroIndexEmpty();
    ok(mem.oldFloats[ch1.TLB[0]] === 60 && mem.newFloats[ch1.TLB[0]] === 60);
    ok(mem.oldFloats[ch1.TLB[1]] === 25 && mem.newFloats[ch1.TLB[1]] === 25);

    schema.compute();
    mem.sync().assertZeroIndexEmpty();
    ok(mem.oldFloats[ch1.TLB[0]] === 120 && mem.newFloats[ch1.TLB[0]] === 120);
    ok(mem.oldFloats[ch1.TLB[1]] === 29 && mem.newFloats[ch1.TLB[1]] === 29);
});
