const fs = require("fs");
const cmds = require("./cmds.json");

fs.readdirSync("./template").forEach((file) => {
    if (!file.toLowerCase().endsWith("tpl")) return;
    const contents = fs.readFileSync(`./template/${file}`, "utf8");
    let show = true;
    contents.split("\n").forEach((str) => {
        if (str.startsWith("//")) return;
        cmds.forEach(({ opcode, opcodeName }) => {
            if (str.includes(`out ${opcode}`)) {
                const funName = str.trim().split('"')[1];
                if (show) {
                    console.log(file + ":");
                    show = false;
                }
                console.log(`${funName}: ${opcodeName}, ${str.trim()}`);
            }
        });
    });
});
