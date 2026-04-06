'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { movieApi, userApi } from '@/app/lib/api';
import MovieCommentsSection from '@/app/components/moviecomments/MovieCommentsSection';
import VideoPlayer from '@/app/components/videoplayer/VideoPlayer';
import { useAuth } from '@/app/context/AuthContext';

interface WatchMovie {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  trailer?: string;
  video?: string;
  duration?: number;
  release_year?: number;
  country?: string;
  actors?: string;
  director?: string;
  rating?: number;
  views: number;
  is_vip?: boolean;
  categories?: { id: number; name: string; slug: string }[];
  can_play?: boolean;
  play_restriction_message?: string | null;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();
  const [movie, setMovie] = useState<WatchMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedMovies, setRelatedMovies] = useState<WatchMovie[]>([]);
  const [historyRecorded, setHistoryRecorded] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchMovie = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await movieApi.getMovieById(id);
        setMovie(data);

        if (data.categories && data.categories.length > 0) {
          try {
            const catMovies = await movieApi.getMovies({ category: data.categories[0].slug, limit: 5 });
            setRelatedMovies(catMovies.filter((m: WatchMovie) => m.id !== data.id).slice(0, 4));
          } catch {
            // Ignore related movies error
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không tìm thấy phim');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  useEffect(() => {
    if (movie && movie.can_play === false) {
      setVipModalOpen(true);
    }
  }, [movie]);

  useEffect(() => {
    if (!token || !id || historyRecorded || !movie || movie.can_play === false) return;
    if (userApi.addToWatchHistory) {
      (async () => {
        try {
          await userApi.addToWatchHistory(token, Number(id));
          setHistoryRecorded(true);
        } catch {
          // Ignore history recording error silently
        }
      })();
    }
  }, [token, id, historyRecorded, movie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        <h1 className="text-gray-800 text-xl font-semibold mb-2">{error || 'Phim không tồn tại'}</h1>
        <Link href="/" className="text-red-500 hover:underline">Quay về trang chủ</Link>
      </div>
    );
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const videoUrl = movie.video;
  const canPlay = movie.can_play !== false;
  const vipModalText = movie.play_restriction_message?.trim() || 'Bạn cần gói VIP phù hợp để xem phim này.';

  return (
    <div className="min-h-screen bg-gray-50">
      {vipModalOpen && !canPlay && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="watch-vip-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="watch-vip-modal-title" className="text-lg font-semibold text-gray-900 mb-3">
              Không thể xem phim
            </h2>
            <p className="text-red-600 text-sm leading-relaxed">{vipModalText}</p>
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <Link
                href={`/pages/movie/${movie.id}`}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                Về trang chi tiết
              </Link>
              <button
                type="button"
                onClick={() => setVipModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                Đóng
              </button>
              <Link
                href="/pages/vip"
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium text-sm"
              >
                Mua gói VIP
              </Link>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <img
                src="/cinemax-logo.png"
                alt="CinemaX"
                className="h-8 md:h-10 w-auto"
              />
            </Link>
            <Link href={`/pages/movie/${movie.id}`} className="text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="overflow-hidden">
              <h1 className="text-gray-800 font-medium text-sm md:text-base truncate max-w-[200px] md:max-w-[300px]">{movie.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {movie.rating != null && movie.rating > 0 && (
              <div className="flex items-center gap-1 text-yellow-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium">{Number(movie.rating).toFixed(1)}</span>
              </div>
            )}
            <div className="text-gray-400 text-xs hidden sm:flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{movie.views?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {!canPlay ? (
          <div className="w-full min-h-[50vh] bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-white/80 text-sm max-w-md mb-4">Nội dung phim chỉ dành cho gói VIP phù hợp.</p>
            <button
              type="button"
              onClick={() => setVipModalOpen(true)}
              className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Xem thông báo chi tiết
            </button>
          </div>
        ) : videoUrl ? (
          <VideoPlayer url={videoUrl} poster={movie.thumbnail} title={movie.title} />
        ) : (
          <div className="w-full min-h-[40vh] bg-gray-900 flex flex-col items-center justify-center text-center px-6 text-white/50 text-sm">
            Chưa có video cho phim này.
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{movie.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {movie.release_year && (
                    <span className="text-gray-500 text-sm">{movie.release_year}</span>
                  )}
                  {movie.duration && (
                    <span className="text-gray-500 text-sm">{formatDuration(movie.duration)}</span>
                  )}
                  {movie.country && (
                    <span className="text-gray-500 text-sm">{movie.country}</span>
                  )}
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-600">HD</span>
                </div>
              </div>

              {movie.categories && movie.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/pages/categories?category=${cat.slug}`}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              {movie.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{movie.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {movie.director && (
                  <div>
                    <span className="text-gray-400">Đạo diễn: </span>
                    <span className="text-gray-700">{movie.director}</span>
                  </div>
                )}
                {movie.actors && (
                  <div>
                    <span className="text-gray-400">Diễn viên: </span>
                    <span className="text-gray-700 line-clamp-1">{movie.actors}</span>
                  </div>
                )}
              </div>

              {movie.trailer && (
                <div className="mt-4">
                  <a
                    href={movie.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Xem Trailer
                  </a>
                </div>
              )}
            </div>

            {!videoUrl && canPlay && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p className="text-gray-500 font-medium mb-1">Chưa có video</p>
                <p className="text-gray-400 text-sm mb-3">Phim này chưa có video. Liên hệ admin để được cập nhật.</p>
                <Link
                  href={`/pages/movie/${movie.id}`}
                  className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại trang phim
                </Link>
              </div>
            )}

            <MovieCommentsSection movieId={movie.id} variant="light" heading="Đánh giá phim" />
          </div>

          <div>
            {relatedMovies.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Phim liên quan</h3>
                <div className="space-y-3">
                  {relatedMovies.map((m) => (
                    <Link
                      key={m.id}
                      href={`/pages/watch/${m.id}`}
                      className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={m.thumbnail || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=300&fit=crop'}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          decoding="async"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=300&fit=crop'; }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-800 text-sm font-medium line-clamp-2 group-hover:text-red-500 transition-colors">{m.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{m.release_year || ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {movie.categories && movie.categories.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thể loại</h3>
            <div className="flex flex-wrap gap-2">
              {movie.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/pages/categories?category=${cat.slug}`}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
