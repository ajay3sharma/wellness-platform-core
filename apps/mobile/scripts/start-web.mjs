import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const expoCommand =
  process.platform === "win32"
    ? path.join(root, "node_modules", ".bin", "expo.CMD")
    : path.join(root, "node_modules", ".bin", "expo");
const port = process.env.EXPO_WEB_PORT ?? process.env.PORT ?? "8081";

const child = spawn(expoCommand, ["start", "--web", "--localhost", "--port", port], {
  cwd: root,
  env: {
    ...process.env,
    EXPO_UNSTABLE_HEADLESS: "1",
    EXPO_NO_TELEMETRY: "1",
    EXPO_NO_DEPENDENCY_VALIDATION: "1"
  },
  stdio: "inherit",
  shell: process.platform === "win32"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
