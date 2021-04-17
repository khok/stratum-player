import { SimpleLibrary } from "stratum/classLibrary/simpleLibrary";
import { Constant } from "stratum/common/constant";
import { Enviroment } from "stratum/enviroment";
import { ClassInfo } from "stratum/fileFormats/cls";
import { Project } from "stratum/project";
import { PathInfo } from "stratum/stratum";
const { ok } = chai.assert;

it("Тест SendMessage() и асинхронки", async () => {
    const text1 = `
float b
float c
string result
b := ~b + 1
SendMessage("", "Recursion2", "c", "av")
`;
    const text2 = `
float c
float av
av := ~av + 2
c := ~c + 1
SendMessage("", "Recursion1")
`;
    const text3 = `
a := 11
s := sin(PI / 2)
res := sin(PI / 2) + "_" + test_sleep_8210460217466098(TestFunc(8) + a - 10);
r1 := ~res == "1_wait11"
`;

    const text4 = `
function
float parameter a
res := sin(PI / 2) + Float(test_sleep_8210460217466098(a))
res := ~res + res + a;
// ожидаем 1 + 1 + 8 = 10
return res
`;

    const info1: ClassInfo = {
        name: "Recursion1",
        version: 0,
        vars: [
            { name: "b", defaultValue: "", description: "", flags: 0, type: "FLOAT" },
            { name: "c", defaultValue: "21", description: "", flags: 0, type: "FLOAT" },
        ],
        sourceCode: text1,
    };
    const info2: ClassInfo = {
        name: "Recursion2",
        version: 0,
        vars: [
            { name: "c", defaultValue: "", description: "", flags: 0, type: "FLOAT" },
            { name: "av", defaultValue: "", description: "", flags: 0, type: "FLOAT" },
        ],
        sourceCode: text2,
    };
    const info3: ClassInfo = {
        name: "SleepTest",
        version: 0,
        vars: [
            { name: "a", defaultValue: "", description: "", flags: 0, type: "FLOAT" },
            { name: "s", defaultValue: "", description: "", flags: 0, type: "FLOAT" },
            { name: "res", defaultValue: "", description: "", flags: 0, type: "STRING" },
            { name: "r1", defaultValue: "", description: "", flags: 0, type: "FLOAT" },
        ],
        sourceCode: text3,
    };
    const info4: ClassInfo = {
        name: "TestFunc",
        version: 0,
        vars: [
            { name: "a", defaultValue: "", description: "", flags: Constant.VF_ARGUMENT, type: "FLOAT" },
            { name: "res", defaultValue: "", description: "", flags: Constant.VF_RETURN, type: "FLOAT" },
        ],
        sourceCode: text4,
    };
    const rootInfo: ClassInfo = {
        name: "root",
        version: 0,
        children: [
            { classname: "Recursion1", flags: 0, handle: 2, position: { x: 0, y: 0 }, schemeName: "" },
            { classname: "SleepTest", flags: 0, handle: 5, position: { x: 0, y: 0 }, schemeName: "" },
            { classname: "Recursion2", flags: 0, handle: 4, position: { x: 0, y: 0 }, schemeName: "" },
        ],
    };

    const classes = new SimpleLibrary([rootInfo, info1, info2, info3, info4]);

    const prj = new Project({ setWaiting: () => {}, resetWaiting: () => {} } as Enviroment, {
        dir: {} as PathInfo,
        classes,
        prjInfo: { rootClassName: "root" },
    });

    const ch1 = prj.root.child(2)!;
    ok(prj.newFloats[ch1["TLB"][0]] === 0);
    ok(prj.newFloats[ch1["TLB"][1]] === 21);

    await prj.root.compute();
    ok(prj.oldFloats[ch1["TLB"][0]] === 60 && prj.newFloats[ch1["TLB"][0]] === 60);
    ok(prj.oldFloats[ch1["TLB"][1]] === 25 && prj.newFloats[ch1["TLB"][1]] === 25);
    ok(prj.newStrings[prj.root.child(5)!["TLB"][2]] === "1_");
    ok(prj.newFloats[prj.root.child(5)!["TLB"][3]] === 0);

    await prj.root.compute();
    ok(prj.oldFloats[ch1["TLB"][0]] === 120 && prj.newFloats[ch1["TLB"][0]] === 120);
    ok(prj.oldFloats[ch1["TLB"][1]] === 29 && prj.newFloats[ch1["TLB"][1]] === 29);
    ok(prj.newStrings[prj.root.child(5)!["TLB"][2]] === "1_wait11");
    ok(prj.newFloats[prj.root.child(5)!["TLB"][3]] === 1);
});
