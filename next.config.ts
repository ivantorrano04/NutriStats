import type {NextConfig} from 'next';
import path from 'path';

const noopPath = path.resolve(__dirname, 'src/lib/noop.ts');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      resolveAlias: {
        'fs': noopPath,
        'fs/promises': noopPath,
        'net': noopPath,
        'tls': noopPath,
        'child_process': noopPath,
        'perf_hooks': noopPath,
        'async_hooks': noopPath,
        'dns': noopPath,
        'http2': noopPath,
        'path': noopPath,
        'os': noopPath,
        'crypto': noopPath,
        'stream': noopPath,
        'http': noopPath,
        'https': noopPath,
        'zlib': noopPath,
        'readline': noopPath,
        'events': noopPath,
        'util': noopPath,
        'buffer': noopPath,
        'vm': noopPath,
        'dgram': noopPath,
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const nodeModules = [
        'fs', 'fs/promises', 'net', 'tls', 'child_process', 'perf_hooks', 'async_hooks', 
        'dns', 'http2', 'path', 'os', 'crypto', 'stream', 'http', 'https', 
        'zlib', 'readline', 'events', 'util', 'buffer', 'vm', 'dgram'
      ];
      
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = noopPath;
      });
    }
    return config;
  },
};

export default nextConfig;
