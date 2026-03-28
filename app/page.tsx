'use client';

import { useEffect, useState } from 'react';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import MovieCard from './components/moviecard/MovieCard';
import { movieApi } from './lib/api';

interface Movie {
  id: number;
  title: string;
  slug: string;
  thumbnail?: string;
  poster_url?: string;
  backdrop_url?: string;
  description?: string;
  duration?: number;
  release_year?: number;
  rating?: number;
  views: number;
  categories?: { id: number; name: string; slug: string }[];
}

export default function Home() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [newMovies, setNewMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [trending, featured, newMoviesList] = await Promise.all([
          movieApi.getTrendingMovies(10),
          movieApi.getMovies({ limit: 10, sortBy: 'rating', order: 'DESC' }),
          movieApi.getMovies({ limit: 15, sortBy: 'updated_at', order: 'DESC' }),
        ]);

        setTrendingMovies(Array.isArray(trending) ? trending : []);
        setFeaturedMovies(Array.isArray(featured) ? featured : []);
        setNewMovies(Array.isArray(newMoviesList) ? newMoviesList : []);

        if (Array.isArray(trending) && trending.length > 0) {
          setHeroMovie(trending[0]);
        } else if (Array.isArray(featured) && featured.length > 0) {
          setHeroMovie(featured[0]);
        } else if (Array.isArray(newMoviesList) && newMoviesList.length > 0) {
          setHeroMovie(newMoviesList[0]);
        }
      } catch (err: any) {
        console.error('Error fetching movies:', err);
        setError(err.message || 'Failed to fetch movies');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryName = (movie: Movie) => {
    if (movie.categories && movie.categories.length > 0) {
      return movie.categories[0].name;
    }
    return 'Phim';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 -m-[8%]">
          <img
            src={heroMovie?.backdrop_url || heroMovie?.poster_url || heroMovie?.thumbnail || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&h=1080&fit=crop"}
            alt="Featured"
            className="w-[116%] h-[116%] object-cover blur-xl scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <span className="inline-block bg-red-600 text-white text-sm font-medium px-3 py-1 rounded mb-4">
              ĐANG CHIẾU
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {heroMovie?.title || 'Phim'}
            </h1>
            <div className="flex items-center gap-4 text-gray-300 mb-6">
              <span className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {heroMovie?.rating || 'N/A'}
              </span>
              <span>{heroMovie?.release_year || 'N/A'}</span>
              <span>{formatDuration(heroMovie?.duration)}</span>
              <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">HD</span>
            </div>
            <p className="text-gray-300 mb-8 line-clamp-3">
              {heroMovie?.description || 'Mô tả phim...'}
            </p>
            <div className="flex gap-4">
              <a
                href={`/pages/movie/${heroMovie?.id}`}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Xem ngay
              </a>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm vào list
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Movies */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Phim nổi bật</h2>
            <a href="/pages/trending" className="text-red-500 hover:text-red-400 text-sm font-medium">
              Xem tất cả
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {featuredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={String(movie.id)}
                title={movie.title}
                poster={movie.poster_url || movie.thumbnail || ''}
                rating={Number(movie.rating) || 0}
                year={movie.release_year || 0}
                genre={getCategoryName(movie)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Movies */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Phim xu hướng</h2>
            <a href="/pages/trending" className="text-red-500 hover:text-red-400 text-sm font-medium">
              Xem tất cả
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {trendingMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={String(movie.id)}
                title={movie.title}
                poster={movie.poster_url || movie.thumbnail || ''}
                rating={Number(movie.rating) || 0}
                year={movie.release_year || 0}
                genre={getCategoryName(movie)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* New Movies */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Phim mới</h2>
            <a href="/pages/categories?category=all" className="text-red-500 hover:text-red-400 text-sm font-medium">
              Xem tất cả
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {newMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={String(movie.id)}
                title={movie.title}
                poster={movie.poster_url || movie.thumbnail || ''}
                rating={Number(movie.rating) || 0}
                year={movie.release_year || 0}
                genre={getCategoryName(movie)}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
