'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';
import { useAuth } from '@/app/context/AuthContext';
import { userApi } from '@/app/lib/api';
import { useToast } from '@/app/components/toast/Toast';

interface ApiMovie {
  id: number;
  title: string;
  thumbnail?: string;
  rating?: number;
  release_year?: number;
  categories?: { id: number; name: string; slug: string }[];
  favorited_at?: string;
}

function mapMovieForCard(m: ApiMovie) {
  return {
    id: String(m.id),
    title: m.title,
    poster: m.thumbnail || '',
    rating: Number(m.rating) || 0,
    year: m.release_year || 0,
    genre: m.categories?.[0]?.name,
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState<ApiMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getFavorites(token);
      setFavorites(Array.isArray(data) ? data : []);
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

  const handleRemoveFavorite = async (movieId: number) => {
    if (!token) return;
    if (!confirm('Xóa phim khỏi danh sách yêu thích?')) return;
    try {
      await userApi.removeFromFavorites(token, movieId);
      setFavorites((prev) => prev.filter((m) => m.id !== movieId));
      showToast('Đã xóa khỏi yêu thích', 'success');
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
          <div className="flex items-center gap-3 mb-8">
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Phim yêu thích</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading ? '...' : `${favorites.length} phim đã lưu`}
              </p>
            </div>
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

          {!loading && favorites.length === 0 && !error && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Chưa có phim yêu thích</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Nhấn vào biểu tượng trái tim ở trang chi tiết phim để thêm vào danh sách yêu thích của bạn.
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

          {!loading && favorites.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {favorites.map((movie) => {
                const card = mapMovieForCard(movie);
                return (
                  <div key={movie.id} className="relative group">
                    <MovieCard
                      id={card.id}
                      title={card.title}
                      poster={card.poster}
                      rating={card.rating}
                      year={card.year}
                      genre={card.genre}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFavorite(movie.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg"
                      title="Xóa khỏi yêu thích"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
