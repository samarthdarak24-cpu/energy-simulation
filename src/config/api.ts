/**
 * Dynamic API and WebSocket endpoint resolver for local development and production deployments.
 * Supports VITE_API_URL and VITE_WS_URL environment variables.
 */

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = (() => {
  if (!rawApiUrl) {
    return 'http://localhost:8000';
  }
  // Prepend https:// if host provided without protocol (common in Render blueprints)
  if (!/^https?:\/\//i.test(rawApiUrl)) {
    return `https://${rawApiUrl}`.replace(/\/$/, '');
  }
  return rawApiUrl.replace(/\/$/, '');
})();

export const WS_BASE_URL = (() => {
  const rawWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (rawWsUrl) {
    return rawWsUrl.replace(/\/$/, '');
  }
  // Convert http -> ws and https -> wss
  return API_BASE_URL.replace(/^http/i, 'ws');
})();
