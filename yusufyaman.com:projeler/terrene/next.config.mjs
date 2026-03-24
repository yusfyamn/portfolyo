import { fileURLToPath } from "node:url";

const basePath = "/terrene";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  outputFileTracingRoot: fileURLToPath(new URL("./", import.meta.url)),
};

export default nextConfig;
