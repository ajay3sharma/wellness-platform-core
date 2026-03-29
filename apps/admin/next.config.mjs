import path from "node:path";

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
