import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Configuración necesaria para Capacitor */
  output: 'export',      // Genera la carpeta 'out' con archivos estáticos
  images: {
    unoptimized: true,   // Capacitor no tiene servidor para optimizar imágenes en tiempo real
  },
  // Si usas rutas con "/" al final o extensiones .html, esto ayuda:
  trailingSlash: true,   
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;