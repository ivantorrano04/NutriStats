import type {NextConfig} from 'next';
import path from 'path';

/**
 * Configuración de Next.js optimizada para exportación estática (Capacitor/Mobile).
 * Maneja la sustitución de módulos de Node.js mediante un Universal Shim.
 */

const noopPath = './src/lib/noop.ts';
const nodeModules = [
  'fs', 'path', 'util', 'events', 'stream', 'crypto', 'os', 'http', 'https', 
  'zlib', 'process', 'express', 'get-port', 'child_process', 'net', 'tls', 
  'dns', 'http2', 'readline', 'vm', 'buffer', 'dgram', 'perf_hooks', 'async_hooks',
  'url', 'querystring', 'string_decoder', 'timers'
];

// Generar alias para Turbopack
const turboAliases = nodeModules.reduce((acc, mod) => {
  acc[mod] = noopPath;
  acc[`node:${mod}`] = noopPath;
  return acc;
}, {} as Record<string, string>);

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
      resolveAlias: turboAliases,
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const absoluteNoopPath = path.resolve(process.cwd(), 'src/lib/noop.ts');
      
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = absoluteNoopPath;
        config.resolve.alias[`node:${mod}`] = absoluteNoopPath;
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
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
