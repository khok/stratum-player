import { strictEqual } from "assert";
import { buildTree } from "stratum/classTree/buildTree";
import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { Project } from "stratum/project/project";
import { parseBytecode } from "stratum/vm/parseBytecode";
import { ParsedCode } from "stratum/vm/types";

async function load(name: string) {
    const fs = await VirtualFileSystem.new([
        { source: `test_projects/${name}.zip`, prefix: "C:/project" },
        { source: "/data/library.zip", prefix: "C:/stdlib" },
    ]);
    const prj = await Project.open<ParsedCode>(fs, { addSearchDirs: ["C:/stdlib"], bytecodeParser: parseBytecode });
    return buildTree(prj.rootClassName, prj.classes).createMemoryManager();
}

(async function () {
    const [balls, balls2] = await Promise.all([load("balls"), load("balls_stress_test")]);
    //минус 3 под зарезервированные поля в начале.
    strictEqual(balls.defaultDoubleValues.length + balls.defaultLongValues.length + balls.defaultStringValues.length - 3, 1235);
    strictEqual(balls2.defaultDoubleValues.length + balls2.defaultLongValues.length + balls2.defaultStringValues.length - 3, 2328);
    console.log("Links test completed.");
})();
