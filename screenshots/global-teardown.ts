import path from "node:path";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";

const screenshotRoot =
  process.env.PLAYWRIGHT_SCREENSHOT_DIR ??
  path.join(process.cwd(), "test-results", "screenshots");

async function collectScreenshots(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const screenshots: Array<{ surface: string; file: string; bytes: number }> = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      screenshots.push(...(await collectScreenshots(absolutePath)));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".png")) {
      continue;
    }

    const metadata = await stat(absolutePath);
    const relativePath = path.relative(screenshotRoot, absolutePath).replaceAll("\\", "/");
    const [surface = "misc"] = relativePath.split("/");

    screenshots.push({
      surface,
      file: relativePath,
      bytes: metadata.size
    });
  }

  return screenshots.sort((left, right) => left.file.localeCompare(right.file));
}

async function writeManifest() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    root: "test-results/screenshots",
    screenshots: await collectScreenshots(screenshotRoot)
  };

  await mkdir(screenshotRoot, { recursive: true });
  await writeFile(
    path.join(screenshotRoot, "index.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

export default async function globalTeardown() {
  if (process.env.PLAYWRIGHT_SCREENSHOT_MODE !== "1") {
    return;
  }

  await writeManifest();
}
