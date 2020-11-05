console.log("для истории, вдруг понадобится");
process.exit(0);
const fs = require("fs");
const { exec } = require("child_process");

var dir = "dist";
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const entryPoint = `src/stratum/api.ts`;

const cmds = [
    "browserify -r ./node_modules/jszip:jszip | esbuild --minify --target=es6",
    `esbuild ${entryPoint} --bundle --global-name=stratum --minify --target=es6 --external:jszip`,
];

const outfile = `${dir}/stratum.min.js`;

const cmd = `(${cmds.join(" && ")})`;

console.log(cmd);
exec(cmd, (_, result, stderr) => {
    console.log(stderr);
    if (stderr) process.exit(stderr ? 1 : 0);
    fs.writeFileSync(outfile, result);
});
