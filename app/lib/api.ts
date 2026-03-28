/**
 * Trình duyệt: mặc định gọi qua rewrite `/api/backend` -> BE (cùng origin với Next, ít lỗi CORS).
 * Có thể ghi đè bằng NEXT_PUBLIC_API_URL (vd deploy tách domain).
 * Server (RSC): gọi thẳng tới BE nội bộ.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    return '/api/backend';
  }

  return (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8080/api').replace(
    /\/$/,
    ''
  );
}

/** URL đầy đủ cho fetch thủ công (admin, AuthContext, …) — cùng logic proxy với fetchApi */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiError(
        0,
        'Không kết nối được API. Hãy chạy backend (thư mục be_cinema: npm run dev, port 8080), rồi tải lại trang.'
      );
    }
    throw err;
  }

  const text = await response.text();
  let data: ApiResponse<T>;
  try {
    data = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      response.status,
      response.ok
        ? 'Phản hồi API không phải JSON'
        : text.slice(0, 200) || 'Lỗi không xác định từ máy chủ'
    );
  }

  if (!response.ok || !data.success) {
    throw new ApiError(response.status, data.message || 'Something went wrong');
  }

  return data.data;
}

/** Upload ảnh thumbnail (admin), trả về { url: string } */
export async function uploadThumbnail(file: File, token: string): Promise<{ url: string }> {
  const url = apiUrl('/admin/upload');
  const formData = new FormData();
  formData.append('thumbnail', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = (await res.json()) as ApiResponse<{ url: string }>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Upload thất bại');
  }
  return json.data;
}

/** Upload video phim (MP4, WebM, MKV) - trả về { url: string } */
export async function uploadVideo(file: File, token: string): Promise<{ url: string }> {
  const url = apiUrl('/admin/upload-video');
  const formData = new FormData();
  formData.append('video', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = (await res.json()) as ApiResponse<{ url: string }>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Upload video thất bại');
  }
  return json.data;
}

// --- VSMOV Admin API ---

export interface VSMOVSearchItem {
  _id: number;
  name: string;
  origin_name: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  year: number | null;
  type: 'single' | 'series';
  tmdb?: {
    type: 'movie' | 'tv';
    id: string;
    vote_average: string;
    vote_count: number;
    season: number | null;
  };
}

export interface VSMOVMovieDetail {
  _id: number;
  name: string;
  origin_name: string;
  slug: string;
  content: string;
  type: 'single' | 'series';
  poster_url: string;
  thumb_url: string;
  year: number | null;
  time: string | null;
  episode_current: string;
  episode_total: string | null;
  quality: string;
  lang: string;
  showtimes: string | null;
  trailer_url: string | null;
  actor: string[];
  director: string[];
  category: Array<{ id: number; name: string; slug: string }>;
  country: Array<{ id: number; name: string; slug: string }>;
  tmdb?: {
    type: 'movie' | 'tv';
    id: string;
    vote_average: string;
    vote_count: number;
  };
  keywords: string;
}

/** Tìm kiếm phim trên VSMOV (admin) */
export async function vsMovSearch(keyword: string, token: string, limit = 10): Promise<VSMOVSearchItem[]> {
  const url = `${apiUrl('/admin/vsmov/search')}?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as ApiResponse<VSMOVSearchItem[]>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Tìm kiếm VSMOV thất bại');
  }
  return json.data;
}

/** Lấy chi tiết phim từ VSMOV (admin) */
export async function vsMovGetMovie(slug: string, token: string): Promise<VSMOVMovieDetail> {
  const url = apiUrl(`/admin/vsmov/movie/${encodeURIComponent(slug)}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as ApiResponse<VSMOVMovieDetail>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Lấy chi tiết phim thất bại');
  }
  return json.data;
}

/** Import phim từ VSMOV vào database (admin) */
export async function vsMovImportMovie(slug: string, token: string): Promise<any> {
  const url = apiUrl(`/admin/vsmov/import/${encodeURIComponent(slug)}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json() as ApiResponse<any>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Import phim thất bại');
  }
  return json.data;
}

export const movieApi = {
  getMovies: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    country?: string;
    year?: number;
    search?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return fetchApi<any[]>(`/movies${query ? `?${query}` : ''}`);
  },

  getMovieById: (id: string | number) => {
    return fetchApi<any>(`/movies/${id}`);
  },

  getTrendingMovies: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchApi<any[]>(`/movies/trending${query}`);
  },

  searchMovies: (query: string) => {
    return fetchApi<any[]>(`/movies/search?q=${encodeURIComponent(query)}`);
  },
};

export const categoryApi = {
  getCategories: () => {
    return fetchApi<any[]>('/categories');
  },

  getMoviesByCategory: (slug: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/categories/${slug}/movies${query ? `?${query}` : ''}`);
  },
};

export const authApi = {
  login: (email: string, password: string) => {
    return fetchApi<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    return fetchApi<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refreshToken: (refreshToken: string) => {
    return fetchApi<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: () => {
    return fetchApi<null>('/auth/logout', { method: 'POST' });
  },
};

export const userApi = {
  getProfile: () => {
    return fetchApi<any>('/users/profile');
  },

  updateProfile: (data: { username?: string; avatar?: string }) => {
    return fetchApi<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getWatchHistory: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/users/history${query ? `?${query}` : ''}`);
  },

  getFavorites: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/users/favorites${query ? `?${query}` : ''}`);
  },

  addToFavorites: (movieId: number) => {
    return fetchApi<any>('/users/favorites', {
      method: 'POST',
      body: JSON.stringify({ movieId }),
    });
  },

  removeFromFavorites: (movieId: number) => {
    return fetchApi<any>(`/users/favorites/${movieId}`, {
      method: 'DELETE',
    });
  },
};

export const commentApi = {
  getComments: (movieId: number, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/comments/${movieId}${query ? `?${query}` : ''}`);
  },

  addComment: (movieId: number, content: string, rating?: number) => {
    return fetchApi<any>(`/comments/${movieId}`, {
      method: 'POST',
      body: JSON.stringify({ content, rating }),
    });
  },

  deleteComment: (commentId: number) => {
    return fetchApi<any>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  movieApi,
  categoryApi,
  authApi,
  userApi,
  commentApi,
};
