import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Allow imports from ../aims-tools/ outside the frontend directory
  experimental: {
    externalDir: true,
    // Don't bundle resend — its dep chain (htmlparser2/entities) is broken at build time
    serverComponentsExternalPackages: ['resend'],
  },
  webpack: (config) => {
    config.resolve.alias['@/aims-tools'] = path.resolve(__dirname, '../aims-tools');
    // Ensure external aims-tools/ imports resolve deps from frontend/node_modules
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || ['node_modules']),
    ];
    // Prevent webpack from resolving symlinks to real paths
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
