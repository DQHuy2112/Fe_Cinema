/**
 * Chuẩn hóa trường actors từ API: Sequelize/JSON có thể trả về mảng, chuỗi JSON hoặc chuỗi phân tách.
 */
export function normalizeActors(actors: unknown): string[] {
  if (actors == null) return [];

  if (Array.isArray(actors)) {
    return actors
      .map((a) => (typeof a === 'string' ? a.trim() : String(a)))
      .filter(Boolean);
  }

  if (typeof actors === 'string') {
    const s = actors.trim();
    if (!s) return [];

    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          return parsed
            .map((a) => (typeof a === 'string' ? a.trim() : String(a)))
            .filter(Boolean);
        }
      } catch {
        // không phải JSON hợp lệ, xử lý như chuỗi thường
      }
    }

    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

/** Ảnh poster mặc định khi API không có thumbnail */
export const PLACEHOLDER_POSTER =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop';

/** Hero mặc định: độ phân giải cao để full màn hình không vỡ nét */
export const PLACEHOLDER_HERO =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=2560&h=1440&fit=crop&q=85';

const TMDB_IMAGE_PREFIX = 'https://image.tmdb.org/t/p/';

/**
 * TMDB: đổi profile (w300, w500, w780, w1280…) sang bản lớn hơn cho hero.
 * `original` = độ nét tối đa (file có thể nặng).
 */
export function tmdbImageLargest(url: string, profile: 'w1280' | 'original' = 'original'): string {
  const u = url.trim();
  if (!u.includes('image.tmdb.org/t/p/')) return u;
  const pathMatch = u.match(/\/t\/p\/[^/]+(\/.+)$/);
  if (!pathMatch) return u;
  return `${TMDB_IMAGE_PREFIX}${profile}${pathMatch[1]}`;
}

export type HeroImageMode = 'wide' | 'poster_only';

/** Nguồn ảnh hero: ưu backdrop; nâng TMDB lên original; poster-only → layout riêng */
export function heroImageSources(
  backdrop?: string | null,
  poster?: string | null,
  thumbnail?: string | null
): { src: string; mode: HeroImageMode } {
  const b = typeof backdrop === 'string' ? backdrop.trim() : '';
  const p = typeof poster === 'string' ? poster.trim() : '';
  const t = typeof thumbnail === 'string' ? thumbnail.trim() : '';

  if (b) {
    return { src: tmdbImageLargest(b, 'original'), mode: 'wide' };
  }
  if (p) {
    return { src: tmdbImageLargest(p, 'original'), mode: 'poster_only' };
  }
  if (t) {
    return { src: tmdbImageLargest(t, 'original'), mode: 'poster_only' };
  }
  return { src: PLACEHOLDER_HERO, mode: 'wide' };
}

export function posterSrc(poster: string | undefined | null): string {
  const t = typeof poster === 'string' ? poster.trim() : '';
  return t || PLACEHOLDER_POSTER;
}
