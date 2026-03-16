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
        // Redirigimos módulos de Node.js y paquetes de servidor al Universal Shim para Turbopack
        'fs': './src/lib/noop.ts',
        'fs/promises': './src/lib/noop.ts',
        'path': './src/lib/noop.ts',
        'util': './src/lib/noop.ts',
        'events': './src/lib/noop.ts',
        'stream': './src/lib/noop.ts',
        'crypto': './src/lib/noop.ts',
        'os': './src/lib/noop.ts',
        'http': './src/lib/noop.ts',
        'https': './src/lib/noop.ts',
        'http2': './src/lib/noop.ts',
        'net': './src/lib/noop.ts',
        'tls': './src/lib/noop.ts',
        'dns': './src/lib/noop.ts',
        'dgram': './src/lib/noop.ts',
        'zlib': './src/lib/noop.ts',
        'readline': './src/lib/noop.ts',
        'child_process': './src/lib/noop.ts',
        'buffer': './src/lib/noop.ts',
        'vm': './src/lib/noop.ts',
        'async_hooks': './src/lib/noop.ts',
        'perf_hooks': './src/lib/noop.ts',
        'express': './src/lib/noop.ts',
        'get-port': './src/lib/noop.ts',
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Aplicamos los alias de Webpack solo en el cliente
    if (!isServer) {
      const noopPath = path.resolve(process.cwd(), 'src/lib/noop.ts');
      
      const nodeModules = [
        'fs', 'fs/promises', 'net', 'tls', 'child_process', 'perf_hooks', 'async_hooks', 
        'dns', 'http2', 'path', 'os', 'crypto', 'stream', 'http', 'https', 
        'zlib', 'readline', 'events', 'util', 'buffer', 'vm', 'dgram',
        'express', 'get-port'
      ];
      
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = noopPath;
        config.resolve.alias[`node:${mod}`] = noopPath;
      });

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        os: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        events: false,
        buffer: false,
        vm: false,
        async_hooks: false,
        dgram: false,
        dns: false,
        http2: false,
      };
    }
    return config;
  },
};

export default nextConfig;
