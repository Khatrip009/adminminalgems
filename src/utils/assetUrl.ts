// src/utils/assetUrl.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getAssetUrl(relativeUrl: string | undefined): string {
  if (!relativeUrl) return '';
  // If already absolute, return as-is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  // Remove leading slash to avoid double slashes
  const clean = relativeUrl.replace(/^\/+/, '');
  return `${API_BASE_URL.replace(/\/+$/, '')}/${clean}`;
}