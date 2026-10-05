// Cross-platform test runner: Windows shells don't expand tests/*.test.mjs.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync("tests").filter((f) => f.endsWith(".test.mjs")).map((f) => `tests/${f}`);
const result = spawnSync("npx", ["tsx", "--test", ...files], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
