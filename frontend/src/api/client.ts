const configuredApiUrl = (import.meta as any).env?.VITE_API_URL || '/api';

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}