import { unzip } from "stratum/api";
import { Player } from "stratum/player";
import { build } from "stratum/schema/build";
import { TreeManager } from "stratum/schema/treeManager";
import { ExecutionContext } from "stratum/vm/executionContext";
const { ok } = chai.assert;

it("Тест SendMessage()", async () => {
    const fs = await fetch("/projects/test_messages.zip")
        .then((r) => r.blob())
        .then(unzip);
    const prj = (await fs.project({ additionalClassPaths: ["library"] })) as Player;
    const tree = build(prj.rootClassName, prj.classes);
    const mmanager = tree.createMemoryManager();
    tree.applyVarSet(prj.stt!);

    const ch1 = tree.getChild(2)!;

    const ctx = new ExecutionContext({
        windows: {} as any,
        projectManager: {} as any,
        classManager: new TreeManager({ tree }),
        memoryManager: mmanager,
    });

    mmanager.init();
    ok(mmanager.defaultDoubleValues[ch1.vars!.globalIds![0]] === 0 && mmanager.newDoubleValues[ch1.vars!.globalIds![0]] === 0);
    ok(mmanager.defaultDoubleValues[ch1.vars!.globalIds![1]] === 21 && mmanager.newDoubleValues[ch1.vars!.globalIds![1]] === 21);

    tree.compute(ctx);
    mmanager.sync();
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![0]] === 60 && mmanager.newDoubleValues[ch1.vars!.globalIds![0]] === 60);
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![1]] === 25 && mmanager.newDoubleValues[ch1.vars!.globalIds![1]] === 25);

    tree.compute(ctx);
    mmanager.sync();
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![0]] === 120 && mmanager.newDoubleValues[ch1.vars!.globalIds![0]] === 120);
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![1]] === 29 && mmanager.newDoubleValues[ch1.vars!.globalIds![1]] === 29);
});
