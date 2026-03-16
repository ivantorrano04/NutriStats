
import type {NextConfig} from 'next';

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
        /**
         * En Next.js 15 + Turbopack, no se puede usar 'false' directamente como en Webpack.
         * Mapeamos los módulos de Node.js a un archivo real vacío para evitar errores de resolución.
         */
        'fs': './src/lib/noop.ts',
        'net': './src/lib/noop.ts',
        'tls': './src/lib/noop.ts',
        'child_process': './src/lib/noop.ts',
        'perf_hooks': './src/lib/noop.ts',
        'async_hooks': './src/lib/noop.ts',
        'dns': './src/lib/noop.ts',
        'http2': './src/lib/noop.ts',
        'path': './src/lib/noop.ts',
        'os': './src/lib/noop.ts',
        'crypto': './src/lib/noop.ts',
        'stream': './src/lib/noop.ts',
        'http': './src/lib/noop.ts',
        'https': './src/lib/noop.ts',
        'zlib': './src/lib/noop.ts',
        'readline': './src/lib/noop.ts',
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      /**
       * Configuración para Webpack (usado en next build fuera de turbo).
       * Aquí 'false' sí indica que el módulo debe ser ignorado.
       */
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        perf_hooks: false,
        dns: false,
        http2: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        readline: false,
      };
    }
    return config;
  },
};

export default nextConfig;
