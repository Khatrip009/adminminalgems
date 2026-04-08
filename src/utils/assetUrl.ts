// src/utils/assetUrl.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
// Better: use a dedicated variable
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || API_BASE_URL.replace(/\/api(\/.*)?$/, '');

export function getAssetUrl(relativeUrl: string | undefined): string {
  if (!relativeUrl) return '';
  // Absolute (http, https, //)
  if (/^(https?:)?\/\//i.test(relativeUrl)) {
    return relativeUrl;
  }
  const clean = relativeUrl.replace(/^\/+/, '');
  const base = ASSET_BASE_URL.replace(/\/+$/, '');
  return `${base}/${clean}`;
}