import { buildTree } from "stratum/classTree/buildTree";
import { TreeManager } from "stratum/classTree/treeManager";
import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { Project } from "stratum/project/project";
import { ExecutionContext } from "stratum/vm/executionContext";
import { parseBytecode } from "stratum/vm/parseBytecode";
import { ParsedCode } from "stratum/vm/types";
const { ok } = chai.assert;

it("Тест SendMessage()", async () => {
    const fs = await VirtualFileSystem.new({ source: "/projects/test_messages.zip" });
    const prj = await Project.open<ParsedCode>(fs, { bytecodeParser: parseBytecode });
    const tree = buildTree(prj.rootClassName, prj.classes);
    const mmanager = tree.createMemoryManager();
    tree.applyVarSet(prj.preloadStt!);

    const ch1 = tree.getChild(2)!;

    const ctx = new ExecutionContext({
        windows: {} as any,
        projectManager: {} as any,
        classManager: new TreeManager({ tree }),
        memoryManager: mmanager,
    });

    mmanager.initValues();
    ok(mmanager.defaultDoubleValues[ch1.vars!.globalIds![0]] === 0 && mmanager.newDoubleValues[ch1.vars!.globalIds![0]] === 0);
    ok(mmanager.defaultDoubleValues[ch1.vars!.globalIds![1]] === 21 && mmanager.newDoubleValues[ch1.vars!.globalIds![1]] === 21);

    tree.compute(ctx);
    mmanager.syncValues();
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![0]] === 60 && mmanager.newDoubleValues[ch1.vars!.globalIds![0]] === 60);
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![1]] === 25 && mmanager.newDoubleValues[ch1.vars!.globalIds![1]] === 25);

    tree.compute(ctx);
    mmanager.syncValues();
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![0]] === 120 && mmanager.newDoubleValues[ch1.vars!.globalIds![0]] === 120);
    ok(mmanager.oldDoubleValues[ch1.vars!.globalIds![1]] === 29 && mmanager.newDoubleValues[ch1.vars!.globalIds![1]] === 29);
});
