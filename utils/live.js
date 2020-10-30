const fs = require("fs");
const watch = require("watch");
const http = require("http");
const handler = require("serve-handler");
const { exec, execSync } = require("child_process");
const WebSocketServer = require("websocket").server;

const target = process.argv[2];
if (target !== "live" && target !== "unit") process.exit(0);
const port = process.argv[3] || 3000;

const entryPoint = `test/${target}/index.ts`;

const deps = ["jszip", "pngjs", "fabric"];

const serveDir = "static";
const outDeps = `${serveDir}/scripts/modules.js`;
const outBundle = `${serveDir}/scripts/${target}.js`;

const buildDeps = `browserify ${deps.map((m) => `-r ./node_modules/${m}:${m}`).join(" ")} > ${outDeps}`;
const buildBundle = `esbuild ${entryPoint} --bundle --outfile=${outBundle} ${deps.map((n) => `--external:${n}`).join(" ")} --sourcemap`;

if (!fs.existsSync(outDeps)) {
    console.log(`Building external modules: ${deps}`);
    execSync(buildDeps);
}

const watchDirs = ["src/stratum", `test/${target}`];

// fileserver
const server = http.createServer((req, res) => handler(req, res, { public: serveDir }));
server.listen(port, () => {
    console.log(`Running at http://localhost:${port}/${target}`);
});
// ws server
const wserver = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: true,
});
wserver.on("connect", (c) =>
    c.on("message", (d) => {
        if (d.utf8Data === "rebuild") build();
    })
);

//watch & rebuild
let hasChanges = true;
const build = () => {
    if (!hasChanges) return;
    hasChanges = false;
    var hrstart = process.hrtime();
    exec(buildBundle, (e, stdout, stderr) => {
        if (stderr) {
            console.log("\x1b[31m", stderr, "\x1b[0m");
            return;
        }
        const btime = process.hrtime(hrstart)[1] / 1000000;
        console.log("\x1b[42m", `Build time: ${btime} ms`, "\x1b[0m");
        wserver.broadcast("refresh");
    });
};

const regex = /(.*\.(ts|js|json)$)(.*(?<!\.d\.ts)$)/;
const opts = {
    filter: (p, stat) => stat.isDirectory() || regex.test(p),
    interval: 1,
};
const watchFiles = (f, cur) => {
    if (!cur || cur.isDirectory()) return;
    console.info(f + " has changed");
    hasChanges = true;
    wserver.broadcast("changed");
};
watchDirs.forEach((d) => {
    console.log(`watch for changes in ${d}`);
    watch.watchTree(d, opts, watchFiles);
});
build();

process.on("SIGINT", () => {
    console.log("bye");
    process.exit(0);
});
