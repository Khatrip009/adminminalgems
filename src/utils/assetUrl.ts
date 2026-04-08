// src/utils/assetUrl.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Remove trailing /api or /api/ to get the root URL for static assets
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export function getAssetUrl(relativeUrl: string | undefined): string {
  if (!relativeUrl) return '';
  // Already absolute – return as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  // Remove leading slash to avoid double slashes
  const clean = relativeUrl.replace(/^\/+/, '');
  return `${ASSET_BASE_URL.replace(/\/+$/, '')}/${clean}`;
}