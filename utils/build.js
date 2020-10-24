const fs = require("fs");
const { execSync } = require("child_process");

var dir = "dist";
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const entryPoint = `src/stratum/api.ts`;

const cmds = [
    "browserify -r ./node_modules/jszip:jszip -r ./node_modules/pngjs:pngjs | esbuild --minify --target=es6",
    `esbuild ${entryPoint} --bundle --global-name=stratum --minify --target=es6 --external:jszip --external:pngjs`,
];

const outfile = `${dir}/index.min.js`;

const cmd = `(${cmds.join(" && ")}) > ${outfile}`;

console.log(cmd);
execSync(cmd);
