const { spawn } = require("node:child_process");
const { watch, existsSync } = require("node:fs");
const { createConnection } = require("node:net");
const { resolve } = require("node:path");

const playgroundDir = resolve(__dirname, "..");
const packagesDir = resolve(__dirname, "../../../packages");
const strapiBin = resolve(playgroundDir, "node_modules/.bin/strapi");
const STRAPI_PORT = process.env.PORT ? Number(process.env.PORT) : 1337;

let strapiProcess = null;
let intentionalKill = false;
let strapiReady = false;

function waitForPort(port) {
  return new Promise((resolve) => {
    const check = () => {
      const socket = createConnection(port, "localhost");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function startStrapi() {
  intentionalKill = false;
  strapiReady = false;

  strapiProcess = spawn(strapiBin, ["develop"], {
    cwd: playgroundDir,
    stdio: "inherit",
  });

  waitForPort(STRAPI_PORT).then(() => {
    strapiReady = true;
  });

  strapiProcess.on("close", (code) => {
    if (!intentionalKill) {
      process.exit(code ?? 0);
    }
  });
}

function restartStrapi(filename) {
  if (!strapiProcess || !strapiReady) return;
  console.log(`\n[dev] Package changed (${filename}), restarting Strapi...\n`);
  const proc = strapiProcess;
  strapiProcess = null;
  intentionalKill = true;
  proc.kill("SIGTERM");
  proc.once("close", () => setTimeout(startStrapi, 300));
}

process.on("SIGINT", () => {
  intentionalKill = true;
  if (strapiProcess) strapiProcess.kill("SIGTERM");
  process.exit(0);
});

startStrapi();

if (existsSync(packagesDir)) {
  watch(packagesDir, { recursive: true }, (event, filename) => {
    if (!filename?.includes("dist") || filename.includes("dist/admin")) return;
    if (!/\.(js|mjs|cjs)$/.test(filename)) return;
    restartStrapi(filename);
  });
}
