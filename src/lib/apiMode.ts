export function isLocalMode(): boolean {
  return !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_LOCAL_ONLY === 'true';
}
