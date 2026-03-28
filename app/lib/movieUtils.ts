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

export function posterSrc(poster: string | undefined | null): string {
  const t = typeof poster === 'string' ? poster.trim() : '';
  return t || PLACEHOLDER_POSTER;
}
