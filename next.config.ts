import type {NextConfig} from 'next';
import path from 'path';

/**
 * Configuración maestra para Capacitor / Exportación Estática.
 * Redirige TODOS los módulos de Node.js al Shim Universal para evitar errores de compilación.
 */

// Usamos ruta relativa para que Turbopack no falle al resolver
const noopPath = './src/lib/noop.ts';
const nodeModules = [
  'fs', 'path', 'util', 'events', 'stream', 'crypto', 'os', 'http', 'https', 'zlib', 
  'process', 'child_process', 'net', 'tls', 'dns', 'http2', 'url', 'buffer', 'vm', 
  'perf_hooks', 'async_hooks', 'readline', 'querystring', 'string_decoder', 'timers'
];

const turboAliases = nodeModules.reduce((acc, mod) => {
  acc[mod] = noopPath;
  acc[`node:${mod}`] = noopPath;
  // Sub-rutas comunes requeridas por Genkit y OTel
  acc[`${mod}/promises`] = noopPath;
  return acc;
}, {} as Record<string, string>);

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
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
      // Para Webpack (SSR parcial) seguimos usando el path absoluto para seguridad
      const absoluteNoopPath = path.resolve(process.cwd(), 'src/lib/noop.ts');
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = absoluteNoopPath;
        config.resolve.alias[`node:${mod}`] = absoluteNoopPath;
        config.resolve.alias[`${mod}/promises`] = absoluteNoopPath;
      });
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
