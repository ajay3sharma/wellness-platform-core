import path from "node:path";

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
