/**
 * Yaqin API Client Utilities
 */

const getInitialBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Render static site host
    if (host.includes('onrender.com')) {
      const savedApi = localStorage.getItem('yaqin_api_url');
      if (savedApi) return savedApi.replace(/\/$/, '');
      
      // Default render API services
      if (host.includes('yaqin-dating-app-1')) {
        return 'https://yaqin-dating-app.onrender.com';
      }
      return 'https://yaqin-api.onrender.com';
    }
  }

  return '';
};

export const API_BASE_URL = getInitialBaseUrl();

export const getApiUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
};

export const getImageUrl = (url?: string | null): string => {
  if (!url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
  return getApiUrl(url);
};

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = getApiUrl(path);
  return fetch(url, options);
};
