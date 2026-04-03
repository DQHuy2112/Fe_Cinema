'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import { useAuth } from '@/app/context/AuthContext';
import { userApi } from '@/app/lib/api';
import { posterSrc } from '@/app/lib/movieUtils';
import { useToast } from '@/app/components/toast/Toast';

interface ApiMovie {
  id: number;
  title: string;
  thumbnail?: string;
  rating?: number;
  release_year?: number;
  categories?: { id: number; name: string; slug: string }[];
  history_id?: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [history, setHistory] = useState<ApiMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getWatchHistory(token);
      setHistory(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/pages/auth');
      return;
    }
    loadData();
  }, [authLoading, token, router, loadData]);

  const handleRemoveHistory = async (movieId: number) => {
    if (!token) return;
    if (!confirm('Xóa khỏi lịch sử xem?')) return;
    try {
      await userApi.removeFromWatchHistory(token, movieId);
      setHistory((prev) => prev.filter((m) => m.id !== movieId));
      showToast('Đã xóa khỏi lịch sử xem', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa thất bại', 'error');
    }
  };

  const handleClearHistory = async () => {
    if (!token) return;
    if (!confirm('Xóa toàn bộ lịch sử xem?')) return;
    try {
      await Promise.all(
        history.map((m) => userApi.removeFromWatchHistory(token, m.id))
      );
      setHistory([]);
      showToast('Đã xóa toàn bộ lịch sử xem', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa thất bại', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lịch sử xem</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  {loading ? '...' : `${history.length} phim đã xem`}
                </p>
              </div>
            </div>

            {!loading && history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa tất cả
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={loadData} className="text-red-600 hover:underline text-sm mt-1">Thử lại</button>
            </div>
          )}

          {loading && !error && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                <p className="text-gray-500 text-sm">Đang tải...</p>
              </div>
            </div>
          )}

          {!loading && history.length === 0 && !error && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lịch sử xem</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Các phim bạn xem sẽ xuất hiện ở đây. Bắt đầu khám phá và thưởng thức những bộ phim hay.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Khám phá phim
              </Link>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {history.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <Link href={`/pages/movie/${movie.id}`} className="block">
                    <div className="aspect-[16/9] bg-gray-100 relative">
                      <img
                        src={posterSrc(movie.thumbnail || '')}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">{movie.title}</h3>
                        <div className="flex items-center gap-2 text-white/80 text-xs mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            {Number(movie.rating) || '—'}
                          </span>
                          <span>·</span>
                          <span>{movie.release_year || '—'}</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveHistory(movie.id);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Đã xem</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {movie.categories?.[0] && (
                        <span className="text-xs text-gray-400">{movie.categories[0].name}</span>
                      )}
                      <Link
                        href={`/pages/watch/${movie.id}`}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Xem lại
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}