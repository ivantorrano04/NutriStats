import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Al usar export estático, esto asegura que cada página tenga su carpeta /index.html
  // Muy importante para que Capacitor no se pierda con las rutas
  trailingSlash: true, 
  
  // Si con la versión anterior te fallaba, prueba a COMENTAR el assetPrefix. 
  // Capacitor maneja la raíz automáticamente si webDir está bien configurado.
  // assetPrefix: './', 

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;