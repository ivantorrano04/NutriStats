import type {NextConfig} from 'next';
import path from 'path';

/**
 * Configuración de Next.js optimizada para exportación estática (Capacitor/Mobile).
 * Maneja la sustitución de módulos de Node.js mediante un Universal Shim.
 */

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
        'fs': './src/lib/noop.ts',
        'node:fs': './src/lib/noop.ts',
        'path': './src/lib/noop.ts',
        'node:path': './src/lib/noop.ts',
        'util': './src/lib/noop.ts',
        'node:util': './src/lib/noop.ts',
        'events': './src/lib/noop.ts',
        'node:events': './src/lib/noop.ts',
        'stream': './src/lib/noop.ts',
        'node:stream': './src/lib/noop.ts',
        'crypto': './src/lib/noop.ts',
        'node:crypto': './src/lib/noop.ts',
        'os': './src/lib/noop.ts',
        'node:os': './src/lib/noop.ts',
        'http': './src/lib/noop.ts',
        'node:http': './src/lib/noop.ts',
        'https': './src/lib/noop.ts',
        'node:https': './src/lib/noop.ts',
        'zlib': './src/lib/noop.ts',
        'node:zlib': './src/lib/noop.ts',
        'process': './src/lib/noop.ts',
        'node:process': './src/lib/noop.ts',
        'express': './src/lib/noop.ts',
        'get-port': './src/lib/noop.ts',
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const noopPath = path.resolve(process.cwd(), 'src/lib/noop.ts');
      
      const nodeModules = [
        'fs', 'path', 'util', 'events', 'stream', 'crypto', 'os', 'http', 'https', 
        'zlib', 'process', 'express', 'get-port', 'child_process', 'net', 'tls', 
        'dns', 'http2', 'readline', 'vm', 'buffer', 'dgram', 'perf_hooks', 'async_hooks'
      ];
      
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = noopPath;
        config.resolve.alias[`node:${mod}`] = noopPath;
      });

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        util: false,
        events: false,
        stream: false,
        crypto: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
