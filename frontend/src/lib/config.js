let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
if (rawUrl && !rawUrl.startsWith('http')) {
  rawUrl = `https://${rawUrl}/api/v1`;
}
export const API_BASE = rawUrl;
export const ORG_ID = 'demo-org';
export const DEFAULT_ORG_ID = 'demo-org';
