import path from "node:path";
import { mkdir, rm } from "node:fs/promises";

const root = process.cwd();
const screenshotRoot = path.join(root, "test-results", "screenshots");

await rm(screenshotRoot, { recursive: true, force: true });
await mkdir(screenshotRoot, { recursive: true });
