export function getApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  if (!base) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${normalizedPath}`;
}

export default getApiUrl;
