'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';
import { movieApi, userApi } from '@/app/lib/api';
import MovieCommentsSection from '@/app/components/moviecomments/MovieCommentsSection';
import { normalizeActors } from '@/app/lib/movieUtils';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/components/toast/Toast';

interface Movie {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  poster_url?: string;
  backdrop_url?: string;
  trailer?: string;
  video?: string;
  duration?: number;
  release_year?: number;
  country?: string;
  actors?: string[] | string;
  director?: string;
  views: number;
  rating?: number;
  is_active: boolean;
  categories?: { id: number; name: string; slug: string }[];
}

export default function MovieDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  const { user, token } = useAuth();
  const { showToast } = useToast();

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const [movieData, trendingData] = await Promise.all([
          movieApi.getMovieById(id),
          movieApi.getTrendingMovies(5),
        ]);

        setMovie(movieData || null);
        setSimilarMovies(trendingData?.filter((m: Movie) => m.id !== Number(id)).slice(0, 5) || []);
      } catch (err: any) {
        console.error('Error fetching movie:', err);
        setError(err.message || 'Failed to fetch movie');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const actorList = useMemo(() => normalizeActors(movie?.actors), [movie?.actors]);

  // Check if current movie is in favorites
  useEffect(() => {
    if (!token || !id) return;
    userApi.getFavorites(token)
      .then((favs: any) => {
        const ids = Array.isArray(favs) ? favs.map((f: any) => f.id) : [];
        setIsFavorite(ids.includes(Number(id)));
      })
      .catch(() => {});
  }, [token, id]);

  const handleToggleFavorite = async () => {
    if (!token) {
      showToast('Vui lòng đăng nhập để thêm vào yêu thích', 'warning');
      return;
    }
    if (!id) return;
    setFavoritesLoading(true);
    try {
      const result = await userApi.toggleFavorite(token, Number(id));
      const wasInFavorites = isFavorite;
      setIsFavorite(!wasInFavorites);
      showToast(wasInFavorites ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Thao tác thất bại', 'error');
    } finally {
      setFavoritesLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-500 text-xl">Lỗi: {error || 'Không tìm thấy phim'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* hero Banner */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 -m-[8%]">
          <img
            src={movie.backdrop_url || movie.poster_url || movie.thumbnail || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&h=1080&fit=crop"}
            alt={movie.title}
            className="w-[116%] h-[116%] object-cover blur-xl scale-105"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0">
              <div className="w-64 md:w-80 rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={movie.thumbnail || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=1200&fit=crop"}
                  alt={movie.title}
                  className="w-full h-auto"
                  decoding="async"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-bold text-white">{movie.rating || 'N/A'}</span>
                </span>
                <span className="bg-red-600 px-2 py-0.5 rounded text-white text-sm font-medium">HD</span>
                <span>{movie.release_year || 'N/A'}</span>
                <span>{formatDuration(movie.duration)}</span>
                <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">PG-13</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.categories?.map((category) => (
                  <Link
                    key={category.id}
                    href={`/pages/categories?category=${category.slug}`}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <p className="text-gray-300 mb-8 leading-relaxed">
                {movie.description || 'Chưa có mô tả cho phim này.'}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href={`/pages/watch/${movie.id}`}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Xem phim
                </Link>
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoritesLoading}
                  className={`bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-60`}
                >
                  {favoritesLoading ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isFavorite ? (
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Chia sẻ
                </button>
              </div>

              {/* Director & Cast */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-white font-semibold mb-2">Đạo diễn</h3>
                  <p className="text-gray-400">{movie.director || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Diễn viên</h3>
                  <p className="text-gray-400">
                    {actorList.length > 0 ? actorList.join(', ') : 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-700">
                <nav className="flex gap-8">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`py-4 border-b-2 font-medium transition-colors ${
                      activeTab === 'info'
                        ? 'border-red-600 text-white'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Thông tin
                  </button>
                  <button
                    onClick={() => setActiveTab('cast')}
                    className={`py-4 border-b-2 font-medium transition-colors ${
                      activeTab === 'cast'
                        ? 'border-red-600 text-white'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Diễn viên
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 border-b-2 font-medium transition-colors ${
                      activeTab === 'reviews'
                        ? 'border-red-600 text-white'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Đánh giá
                  </button>
                </nav>
              </div>

              {activeTab === 'info' && (
                <div className="py-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-gray-500 text-sm">Ngày phát hành</h4>
                      <p className="text-white">{movie.release_year || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <h4 className="text-gray-500 text-sm">Thời lượng</h4>
                      <p className="text-white">{formatDuration(movie.duration)}</p>
                    </div>
                    <div>
                      <h4 className="text-gray-500 text-sm">Quốc gia</h4>
                      <p className="text-white">{movie.country || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <h4 className="text-gray-500 text-sm">Lượt xem</h4>
                      <p className="text-white">{movie.views?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cast' && (
                <div className="py-6">
                  {actorList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {actorList.map((actor, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-sm">{actor[0]}</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{actor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Chưa cập nhật thông tin diễn viên.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="py-6">
                  <MovieCommentsSection movieId={Number(id)} variant="dark" heading="Đánh giá" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-[1920px] mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Phim tương tự</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {similarMovies.map((movieItem) => (
                <MovieCard
                  key={movieItem.id}
                  id={String(movieItem.id)}
                  title={movieItem.title}
                  poster={movieItem.thumbnail || ''}
                  rating={Number(movieItem.rating) || 0}
                  year={movieItem.release_year || 0}
                  genre={movieItem.categories?.[0]?.name || 'Phim'}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
