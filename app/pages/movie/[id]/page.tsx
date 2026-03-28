'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';
import { movieApi } from '@/app/lib/api';
import { normalizeActors } from '@/app/lib/movieUtils';

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
  /** API có thể trả mảng, chuỗi JSON hoặc chuỗi phân tách */
  actors?: string[] | string;
  director?: string;
  views: number;
  rating?: number;
  is_active: boolean;
  categories?: { id: number; name: string; slug: string }[];
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  rating?: number;
  createdAt: string;
  user: { id: number; username: string };
}

export default function MovieDetail() {
  const params = useParams();
  const id = params?.id as string;
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');

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

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-500 text-xl">Lỗi: {error || 'Không tìm thấy phim'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Banner */}
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
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
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
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm vào list
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
                    Đánh giá ({movie.comments?.length || 0})
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
                  {movie.comments && movie.comments.length > 0 ? (
                    movie.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-900 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">
                              {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="text-white font-medium">{comment.user?.username || 'Người dùng'}</span>
                          {comment.rating && (
                            <span className="text-yellow-500 flex items-center gap-1 text-sm">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              {comment.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                        <p className="text-gray-500 text-xs mt-2">{formatDateTime(comment.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">Chưa có đánh giá nào.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1920px] mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Phim tương tự</h2>
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
