import path from "node:path";

for (const envPath of [path.join(process.cwd(), "../..", ".env"), path.join(process.cwd(), ".env")]) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Optional local env files are loaded when present.
  }
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: [
    "@platform/brand",
    "@platform/config",
    "@platform/sdk",
    "@platform/types",
    "@platform/ui"
  ]
};

export default nextConfig;
