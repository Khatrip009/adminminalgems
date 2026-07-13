/**
 * Searches localStorage for a JWT token (starts with "eyJ").
 * Returns the token string, or null if not found.
 */
export function getAuthToken(): string | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key);
    // JWT tokens typically start with "eyJ"
    if (value && value.startsWith("eyJ")) {
      return value;
    }
  }
  // fallback: check a global variable (useful for debugging)
  if ((window as any).__AUTH_TOKEN__) {
    return (window as any).__AUTH_TOKEN__;
  }
  return null;
}