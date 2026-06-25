const API = import.meta.env.VITE_API_URL || '';

export function getImageUrl(path) {
  if (!path) return '/placeholder-tree.svg';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}

export function treeImageUrl(path) {
  if (!path) return '/placeholder-tree.svg';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}
