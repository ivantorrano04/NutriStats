
import type {NextConfig} from 'next';
import path from 'path';

/**
 * Configuración de Next.js optimizada para exportación estática (Capacitor/Mobile).
 * Maneja la sustitución de módulos de Node.js para el entorno del navegador.
 */

const absoluteNoopPath = path.resolve(process.cwd(), 'src/lib/noop.ts');

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
        // Alias para Turbopack (Entorno de desarrollo)
        // Solo añadimos los módulos que causan errores en el navegador.
        // Evitamos alias de 'path' o 'fs' de forma global aquí si es posible,
        // pero para Capacitor son necesarios en el bundle final.
        'fs': absoluteNoopPath,
        'fs/promises': absoluteNoopPath,
        'net': absoluteNoopPath,
        'tls': absoluteNoopPath,
        'child_process': absoluteNoopPath,
        'perf_hooks': absoluteNoopPath,
        'async_hooks': absoluteNoopPath,
        'dns': absoluteNoopPath,
        'http2': absoluteNoopPath,
        'os': absoluteNoopPath,
        'crypto': absoluteNoopPath,
        'stream': absoluteNoopPath,
        'http': absoluteNoopPath,
        'https': absoluteNoopPath,
        'zlib': absoluteNoopPath,
        'readline': absoluteNoopPath,
        'events': absoluteNoopPath,
        'util': absoluteNoopPath,
        'buffer': absoluteNoopPath,
        'vm': absoluteNoopPath,
        'dgram': absoluteNoopPath,
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // En el lado del cliente, redirigimos todos los módulos de Node.js a nuestro shim.
      const nodeModules = [
        'fs', 'fs/promises', 'net', 'tls', 'child_process', 'perf_hooks', 'async_hooks', 
        'dns', 'http2', 'path', 'os', 'crypto', 'stream', 'http', 'https', 
        'zlib', 'readline', 'events', 'util', 'buffer', 'vm', 'dgram'
      ];
      
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = absoluteNoopPath;
      });

      // Fallback para Webpack 5
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
      };
    }
    return config;
  },
};

export default nextConfig;
