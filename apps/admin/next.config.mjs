import path from "node:path";

for (const envPath of [path.join(process.cwd(), "../..", ".env"), path.join(process.cwd(), ".env")]) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Optional local env files are loaded when present.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  reactStrictMode: true,
  transpilePackages: ["@platform/ai", "@platform/brand", "@platform/config", "@platform/types", "@platform/ui"],
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
