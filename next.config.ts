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
         * En Next.js 15 + Turbopack, mapeamos los módulos de Node.js a un archivo real.
         * Esto soluciona los errores de 'Module not found' y 'Class extends undefined'
         * proporcionando un shim que actúa como constructor y objeto.
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
        'events': './src/lib/noop.ts',
        'util': './src/lib/noop.ts',
        'buffer': './src/lib/noop.ts',
        'vm': './src/lib/noop.ts',
        'dgram': './src/lib/noop.ts',
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      /**
       * Configuración para Webpack (usado en next build).
       * Redirigimos los módulos de Node.js al mismo shim para consistencia.
       */
      const nodeModules = [
        'fs', 'net', 'tls', 'child_process', 'perf_hooks', 'async_hooks', 
        'dns', 'http2', 'path', 'os', 'crypto', 'stream', 'http', 'https', 
        'zlib', 'readline', 'events', 'util', 'buffer', 'vm', 'dgram'
      ];
      
      nodeModules.forEach(mod => {
        config.resolve.alias[mod] = './src/lib/noop.ts';
      });
    }
    return config;
  },
};

export default nextConfig;
