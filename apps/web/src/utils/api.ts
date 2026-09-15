/**
 * Yaqin API Client Utilities
 */

const CANDIDATE_API_URLS = [
  import.meta.env.VITE_API_URL,
  'https://yaqin-dating-app.onrender.com',
  'https://yaqin-api.onrender.com',
].filter(Boolean) as string[];

let activeBaseUrl = '';

const initBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    activeBaseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('onrender.com')) {
      const saved = localStorage.getItem('yaqin_api_url');
      if (saved) {
        activeBaseUrl = saved.replace(/\/$/, '');
        return;
      }
      activeBaseUrl = 'https://yaqin-dating-app.onrender.com';
      return;
    }
  }

  activeBaseUrl = '';
};

initBaseUrl();

export const API_BASE_URL = activeBaseUrl;

export const setApiBaseUrl = (url: string) => {
  activeBaseUrl = url.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem('yaqin_api_url', activeBaseUrl);
  }
};

export const getApiUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!activeBaseUrl) {
    return cleanPath;
  }
  return `${activeBaseUrl}${cleanPath}`;
};

export const getImageUrl = (url?: string | null): string => {
  if (!url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
  return getApiUrl(url);
};

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = getApiUrl(path);
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    // If request failed and we are on onrender.com with primary URL, try fallback URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
      for (const fallback of CANDIDATE_API_URLS) {
        if (fallback && !url.startsWith(fallback)) {
          try {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            const altUrl = `${fallback.replace(/\/$/, '')}${cleanPath}`;
            const altRes = await fetch(altUrl, options);
            if (altRes.ok || altRes.status < 500) {
              setApiBaseUrl(fallback);
              return altRes;
            }
          } catch {}
        }
      }
    }
    throw err;
  }
};
