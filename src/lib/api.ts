/**
 * Obtiene la URL absoluta de la API.
 * Crítico para Capacitor en iOS donde las URLs relativas fallan.
 */
export function getApiUrl(path: string) {
  // En producción (iOS), usamos la URL configurada.
  // En desarrollo local, usamos el host de desarrollo.
  const base = process.env.NEXT_PUBLIC_API_URL || 
               process.env.NEXT_PUBLIC_DEV_HOST || 
               '';

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  if (!base) {
    // Si no hay base, intentamos construir una basada en el origen si estamos en web.
    if (typeof window !== 'undefined' && window.location.origin.includes('localhost')) {
       return `http://localhost:9002${normalizedPath}`;
    }
    return normalizedPath;
  }

  return `${base.replace(/\/$/, '')}${normalizedPath}`;
}

export default getApiUrl;
