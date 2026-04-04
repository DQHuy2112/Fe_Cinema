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

// ============================================================
// JWT Refresh Token — Automatic Interceptor
// ============================================================
// Phát hiện file nào đang gọi để tránh circular call
const isBrowser = typeof window !== 'undefined';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

/** Đồng bộ React state sau khi fetchApi refresh JWT thành công */
export const AUTH_ACCESS_TOKEN_REFRESHED_EVENT = 'cinema-access-token-refreshed';

function onRefreshFailed() {
  refreshSubscribers = [];
  if (isBrowser) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    window.location.href = '/pages/auth?expired=1';
  }
}

/** Retry sau refresh: ghi đè Authorization cũ (vd userApi truyền Bearer hết hạn). */
function headersWithFreshBearer(options: RequestInit, accessToken: string): Record<string, string> {
  const out: Record<string, string> = { 'Content-Type': 'application/json' };
  const raw = options.headers;
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      if (key.toLowerCase() !== 'authorization') out[key] = value;
    });
  } else if (Array.isArray(raw)) {
    for (const [key, value] of raw) {
      if (key.toLowerCase() !== 'authorization') out[key] = value;
    }
  } else if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (key.toLowerCase() !== 'authorization' && typeof value === 'string') out[key] = value;
    }
  }
  out.Authorization = `Bearer ${accessToken}`;
  return out;
}

async function doRefreshToken(): Promise<string | null> {
  if (!isBrowser) return null;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    onRefreshFailed();
    return null;
  }

  try {
    const res = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json();
    if (json.success && json.data?.accessToken) {
      const newAccessToken = json.data.accessToken;
      const newRefreshToken = json.data.refreshToken;

      localStorage.setItem('token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      if (isBrowser) {
        window.dispatchEvent(
          new CustomEvent(AUTH_ACCESS_TOKEN_REFRESHED_EVENT, { detail: { accessToken: newAccessToken } })
        );
      }

      onTokenRefreshed(newAccessToken);
      return newAccessToken;
    } else {
      onRefreshFailed();
      return null;
    }
  } catch {
    onRefreshFailed();
    return null;
  }
}

/** Khi Next.js rewrite tới BE lỗi (BE tắt), thường trả 500 + body "Internal Server Error" (không phải JSON). */
function messageWhenUpstreamLikelyDown(status: number, rawBody: string): string | null {
  const trimmed = rawBody.trim();
  const lower = trimmed.toLowerCase();
  if (status === 502 || status === 503 || status === 504) {
    return 'Không kết nối được API backend. Hãy chạy be_cinema (npm run dev, cổng 8080) rồi tải lại trang.';
  }
  if (status === 500) {
    if (!trimmed || lower === 'internal server error' || lower.startsWith('<!doctype')) {
      return 'Không kết nối được API backend. Hãy chạy be_cinema (npm run dev, cổng 8080) rồi tải lại trang.';
    }
  }
  return null;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  // Gắn token tự động từ localStorage (nếu chưa có trong options)
  let token: string | null = null;
  if (isBrowser) {
    token = localStorage.getItem('token');
  }

  const hasAuthHeader = options.headers && (
    (options.headers as Record<string, string>)['Authorization'] ||
    (options.headers as Record<string, string>)['authorization']
  );

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && !hasAuthHeader ? { Authorization: `Bearer ${token}` } : {}),
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

  // Xử lý 401 — thử refresh token rồi retry 1 lần (kể cả khi caller đã gửi Authorization, vd userApi)
  if (response.status === 401 && isBrowser && (token || hasAuthHeader)) {
    const msg = await response.clone().text();
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(msg);
    } catch {
      throw new ApiError(response.status, msg.slice(0, 200) || 'Lỗi không xác định');
    }

    // Nếu backend báo token hết hạn
    if (json.message?.toLowerCase().includes('expired') ||
        json.message?.toLowerCase().includes('invalid') ||
        json.message?.toLowerCase().includes('token')) {

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await doRefreshToken();
        isRefreshing = false;

        if (newToken) {
          // Retry request với token mới
          response = await fetch(url, {
            ...options,
            headers: headersWithFreshBearer(options, newToken),
          });
        } else {
          throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      } else {
        // Đang refresh rồi — đăng ký callback, chờ token mới
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              const retryRes = await fetch(url, {
                ...options,
                headers: headersWithFreshBearer(options, newToken),
              });
              const retryJson = await retryRes.json();
              if (!retryRes.ok || !retryJson.success) {
                reject(new ApiError(retryRes.status, retryJson.message || 'Lỗi sau khi refresh'));
              } else {
                resolve(retryJson.data as T);
              }
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    } else {
      throw new ApiError(response.status, json.message || 'Unauthorized');
    }
  }

  const text = await response.text();
  let data: ApiResponse<T>;
  try {
    data = JSON.parse(text) as ApiResponse<T>;
  } catch {
    const upstreamHint = messageWhenUpstreamLikelyDown(response.status, text);
    throw new ApiError(
      response.status,
      upstreamHint ??
        (response.ok
          ? 'Phản hồi API không phải JSON'
          : text.slice(0, 200) || 'Lỗi không xác định từ máy chủ')
    );
  }

  if (!response.ok || !data.success) {
    throw new ApiError(response.status, data.message || 'Something went wrong');
  }

  return data.data;
}

/**
 * Multipart upload qua Next rewrite: FormData chỉ gửi 1 lần; nếu 401 do JWT hết hạn thì refresh rồi gửi lại.
 * Ưu tiên token từ caller, fallback localStorage (đồng bộ với fetchApi).
 */
async function postMultipartUploadWithRefresh(
  url: string,
  fieldName: string,
  file: File,
  callerToken: string | null
): Promise<Response> {
  const accessToken =
    (callerToken && callerToken.trim()) ||
    (isBrowser ? localStorage.getItem('token')?.trim() || '' : '');
  if (!accessToken) {
    throw new ApiError(401, 'Chưa đăng nhập');
  }

  const post = (t: string) => {
    const fd = new FormData();
    fd.append(fieldName, file);
    return fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
      body: fd,
    });
  };

  let res = await post(accessToken);
  if (res.status !== 401 || !isBrowser) return res;

  let bodyText = '';
  try {
    bodyText = await res.clone().text();
  } catch {
    return res;
  }
  let parsed: { message?: string };
  try {
    parsed = JSON.parse(bodyText) as { message?: string };
  } catch {
    return res;
  }
  const msg = (parsed.message || '').toLowerCase();
  const shouldRefresh =
    msg.includes('expired') ||
    msg.includes('invalid') ||
    msg.includes('token') ||
    msg.includes('no token');
  if (!shouldRefresh) return res;

  const newToken = await doRefreshToken();
  if (!newToken) {
    throw new ApiError(401, parsed.message || 'Phiên đăng nhập hết hạn');
  }
  return post(newToken);
}

/** Upload ảnh thumbnail (admin), trả về { url: string } */
export async function uploadThumbnail(file: File, token: string): Promise<{ url: string }> {
  const url = apiUrl('/admin/upload');
  const res = await postMultipartUploadWithRefresh(url, 'thumbnail', file, token);

  const json = (await res.json()) as ApiResponse<{ url: string }>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Upload thất bại');
  }
  return json.data;
}

/** Upload video phim (MP4, WebM, MKV) - trả về { url: string } */
export async function uploadVideo(file: File, token: string): Promise<{ url: string }> {
  const url = apiUrl('/admin/upload-video');
  const res = await postMultipartUploadWithRefresh(url, 'video', file, token);

  const json = (await res.json()) as ApiResponse<{ url: string }>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Upload video thất bại');
  }
  return json.data;
}

/** Upload avatar người dùng - trả về { avatar: string } */
export async function uploadAvatar(file: File, token: string): Promise<{ avatar: string }> {
  const url = apiUrl('/users/avatar');
  const res = await postMultipartUploadWithRefresh(url, 'avatar', file, token);

  const json = (await res.json()) as ApiResponse<{ avatar: string }>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Upload avatar thất bại');
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

  forgotPassword: (email: string) => {
    return fetchApi<{ otp?: string; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: (email: string, otp: string, newPassword: string) => {
    return fetchApi<null>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const userApi = {
  getProfile: (token: string) => {
    return fetchApi<any>('/users/profile', { headers: authHeaders(token) });
  },

  updateProfile: (token: string, data: { username?: string; email?: string; avatar?: string }) => {
    return fetchApi<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    });
  },

  changePassword: (token: string, currentPassword: string, newPassword: string) => {
    return fetchApi<null>('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: authHeaders(token),
    });
  },

  getWatchHistory: (token: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/users/history${query ? `?${query}` : ''}`, {
      headers: authHeaders(token),
    });
  },

  getFavorites: (token: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/users/favorites${query ? `?${query}` : ''}`, {
      headers: authHeaders(token),
    });
  },

  getMyComments: (token: string) => {
    return fetchApi<any[]>('/users/comments', { headers: authHeaders(token) });
  },

  /** Backend: POST /users/favorites/:movieId bật/tắt yêu thích */
  toggleFavorite: (token: string, movieId: number) => {
    return fetchApi<any>(`/users/favorites/${movieId}`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  },

  addToWatchHistory: (token: string, movieId: number) => {
    return fetchApi<any>(`/users/history/${movieId}`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  },

  removeFromWatchHistory: (token: string, movieId: number) => {
    return fetchApi<any>(`/users/history/${movieId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  removeFromFavorites: (token: string, movieId: number) => {
    return fetchApi<any>(`/users/favorites/${movieId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};

export const commentApi = {
  getComments: (movieId: number, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<any[]>(`/movies/${movieId}/comments${query ? `?${query}` : ''}`);
  },

  addComment: (movieId: number, content: string, rating?: number, token?: string) => {
    return fetchApi<any>(`/movies/${movieId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, rating }),
      ...(token ? { headers: authHeaders(token) } : {}),
    });
  },

  deleteComment: (commentId: number, token: string) => {
    return fetchApi<any>(`/comments/${commentId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};

export const vipApi = {
  getPackages: () => {
    return fetchApi<VipPackage[]>('/vip/packages');
  },

  getMyVip: (token: string) => {
    return fetchApi<VipStatus>('/vip/me', { headers: authHeaders(token) });
  },

  createPayment: (token: string, packageId: number) => {
    return fetchApi<{ paymentUrl: string; txnRef: string }>('/vip/create', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
      headers: authHeaders(token),
    });
  },

  createMoMoPayment: (token: string, packageId: number) => {
    return fetchApi<{ paymentUrl: string; orderId: string }>('/vip/create-momo', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
      headers: authHeaders(token),
    });
  },
};

export interface VipPackage {
  id: number;
  name: string;
  price: number;
  duration: number;
  description?: string;
  is_active: boolean;
}

export interface VipStatus {
  isVip: boolean;
  status: 'active' | 'expired' | 'none';
  packageName?: string;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
}

export default {
  movieApi,
  categoryApi,
  authApi,
  userApi,
  commentApi,
  vipApi,
};
