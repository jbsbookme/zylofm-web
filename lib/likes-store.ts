// Gestión de likes en localStorage (sin backend)

const LIKES_KEY = 'zylofm_likes';

export function getLikes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LIKES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isLiked(mixId: string): boolean {
  return getLikes().includes(mixId);
}

export function toggleLike(mixId: string): boolean {
  const likes = getLikes();
  const index = likes.indexOf(mixId);
  
  if (index === -1) {
    likes.push(mixId);
  } else {
    likes.splice(index, 1);
  }
  
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  return index === -1; // true si ahora está liked
}

export function getLikeCount(): number {
  return getLikes().length;
}
