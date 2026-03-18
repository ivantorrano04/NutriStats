import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Obligatorio para generar la carpeta 'out'
  images: {
    unoptimized: true, // Obligatorio: iOS no puede optimizar imágenes en local
  },
  trailingSlash: true, // Obligatorio: asegura que /perfil se convierta en /perfil/index.html
  
  // Nota: Hemos eliminado assetPrefix: './' ya que con trailingSlash: true
  // y la configuración de server en Capacitor, no debería ser necesario.

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;