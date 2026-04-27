/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Action body limit must live under `experimental.serverActions` (see Next.js docs).
  // Top-level `serverActions` is ignored — default 1 MB caused large library uploads to fail.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
