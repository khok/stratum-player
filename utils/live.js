const fs = require("fs");
const watch = require("watch");
const http = require("http");
const handler = require("serve-handler");
const { exec, execSync } = require("child_process");
const WebSocketServer = require("websocket").server;

const target = process.argv[2];
if (target !== "tests" && target !== "demo") process.exit(0);

const entryPoint = `src/${target}/index.ts`;

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

const watchDirs = ["src/stratum", `src/${target}`];

let wsConn;
// fileserver
{
    const server = http.createServer((req, res) => handler(req, res, { public: serveDir }));
    server.listen(3000, () => {
        console.log(`Running at http://localhost:3000/${target}`);
    });

    new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: true,
    })
        .on("connect", (c) => {
            wsConn = c;
        })
        .on("close", (c) => {
            wsConn = undefined;
        });
}

const refreshPage = () => {
    if (wsConn) wsConn.send("42");
};

const build = (refresh) => {
    var hrstart = process.hrtime();
    exec(buildBundle, (e, stdout, stderr) => {
        if (stderr) {
            console.log("\x1b[31m", stderr, "\x1b[0m");
            return;
        }
        const btime = process.hrtime(hrstart)[1] / 1000000;
        console.log("\x1b[42m", `Build time: ${btime} ms`, "\x1b[0m");
        if (refresh) refreshPage();
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
    build(true);
};
watchDirs.forEach((d) => {
    console.log(`watch for changes in ${d}`);
    watch.watchTree(d, opts, watchFiles);
});
build(false);

process.on("SIGINT", () => {
    console.log("bye");
    process.exit(0);
});
