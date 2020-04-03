const fs = require("fs");

const res = [];
fs.readdirSync("./template").forEach((file) => {
    if (!file.toLowerCase().endsWith("tpl")) return;
    const contents = fs.readFileSync(`./template/${file}`, "utf8");
    let show = true;
    contents.split("\n").forEach((str) => {
        if (str.startsWith("//") || !str.includes(` out `)) return;
        const funName = str.trim().split('"')[1];
        const [a, opcodeStr] = str.trim().split(" out ");
        let args = "";
        if (str.trim().includes(" arg ")) {
            args = str.split(" arg ")[1].split(" out ")[0].replace(/["']/g, "");
        }
        if (show) {
            console.log(file + ":");
            show = false;
        }
        // console.log(`${funName}(${args}): ${opcodeStr}, ${str.trim()}`);
        // arr.push({name: funName, args: args.split(",").map(c => c.trim().replace(/["']/g, '')), code: parseInt(opcodeStr)});
        const code = parseInt(opcodeStr);
        if (!code) return;
        if (res.code) console.log(funName, code);
        res[code] = { name: funName, args };
        // arr.push({name: funName, args, code: parseInt(opcodeStr)});
    });
});
fs.writeFileSync("commands.json", JSON.stringify(res, null, 4));
