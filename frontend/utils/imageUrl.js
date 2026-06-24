const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getImageUrl(path) {
  if (!path) return '/placeholder-tree.svg';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}
