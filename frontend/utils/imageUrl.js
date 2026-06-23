// Все внешние картинки загружаем через наш прокси на бэкенде.
// Это обходит CORS и hotlinking-блокировки Wikimedia.
const API_URL = import.meta.env.VITE_API_URL || '';

export function treeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  if (url.startsWith('http')) return `${API_URL}/api/imageproxy?url=${encodeURIComponent(url)}`;
  return url;
}
