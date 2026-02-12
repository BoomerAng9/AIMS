/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Prevent webpack from resolving symlinks to real paths so that
    // symlinked aims-tools/ resolves dependencies from frontend/node_modules
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
