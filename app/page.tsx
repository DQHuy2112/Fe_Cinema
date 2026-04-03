'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import MovieCard from './components/moviecard/MovieCard';
import { movieApi } from './lib/api';
import { heroImageSources } from './lib/movieUtils';

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
  rating?: number | string;
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
  const trendingRef = useRef<HTMLDivElement>(null);

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

  const formatRating = (value: number | string | undefined | null) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(1) : 'N/A';
  };

  const formatDuration = (minutes?: number | string) => {
    const m = Number(minutes);
    if (!Number.isFinite(m) || m <= 0) return 'N/A';
    const hours = Math.floor(m / 60);
    const mins = Math.round(m % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryName = (movie: Movie) => {
    if (movie.categories && movie.categories.length > 0) {
      return movie.categories[0].name;
    }
    return 'Phim';
  };

  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingRef.current) {
      const scrollAmount = 320;
      trendingRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#e2e8f0] border-t-[#f20d0d] rounded-full animate-spin" />
          <p className="text-[#475569] font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 bg-[#fee2e2] rounded-2xl max-w-md mx-4">
          <svg className="w-16 h-16 text-[#f20d0d] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Đã xảy ra lỗi</h2>
          <p className="text-[#475569]">{error}</p>
        </div>
      </div>
    );
  }

  const heroImg = heroImageSources(
    heroMovie?.backdrop_url,
    heroMovie?.poster_url,
    heroMovie?.thumbnail
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - Cinematic Style */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background: backdrop full-bleed (TMDB original); poster-only = blur fill + ảnh nét object-contain */}
        <div className="absolute inset-0">
          {heroImg.mode === 'wide' ? (
            <img
              src={heroImg.src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <>
              <img
                src={heroImg.src}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-center blur-2xl scale-110 opacity-95"
                decoding="async"
                fetchPriority="high"
              />
              <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[6%] lg:pr-[10%]">
                <img
                  src={heroImg.src}
                  alt={heroMovie?.title ? `Poster ${heroMovie.title}` : 'Poster phim'}
                  className="relative z-0 max-h-[min(88vh,920px)] w-auto max-w-[min(92vw,420px)] object-contain shadow-2xl rounded-xl ring-1 ring-white/10"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </>
          )}
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/90 via-[#0f172a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 pt-32 pb-20 px-6 lg:px-8 min-h-screen flex items-center">
          <div className="max-w-3xl animate-fade-in">
            {/* Label */}
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 bg-[#f20d0d] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                TRENDING PREMIERE
              </span>
            </div>
            
            {/* Title */}
            <h1 className="display-xl text-white mb-6">
              {heroMovie?.title?.toUpperCase() || 'PHIM'}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-white/80 mb-6">
              <div className="flex items-center gap-1.5">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-semibold text-white">{formatRating(heroMovie?.rating)}</span>
              </div>
              <span className="w-1 h-1 bg-white/50 rounded-full" />
              <span>{heroMovie?.release_year || 'N/A'}</span>
              <span className="w-1 h-1 bg-white/50 rounded-full" />
              <span>{formatDuration(heroMovie?.duration)}</span>
              {heroMovie?.categories?.[0] && (
                <>
                  <span className="w-1 h-1 bg-white/50 rounded-full" />
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {heroMovie.categories[0].name}
                  </span>
                </>
              )}
            </div>
            
            {/* Description */}
            <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
              {heroMovie?.description || 'Khám phá thế giới điện ảnh với những bộ phim hấp dẫn nhất.'}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/pages/movie/${heroMovie?.id}`}
                className="inline-flex items-center gap-3 bg-[#f20d0d] hover:bg-[#d90a0a] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(242,13,13,0.4)] shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Xem ngay
              </Link>
              <Link
                href={`/pages/watch/${heroMovie?.id}`}
                className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border border-white/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Trailer
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-white/60">
            <span className="text-xs font-medium tracking-widest uppercase">Cuộn xuống</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full p-1">
              <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 px-6 lg:px-8 bg-[#f8f9fa]">
        <div className="max-w-[1920px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="accent-bar" />
              <div>
                <span className="label-caps text-[#f20d0d]">Top Hits</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mt-1">
                  Phim xu hướng
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scrollTrending('left')}
                className="p-3 rounded-xl bg-white hover:bg-[#f1f5f9] text-[#475569] hover:text-[#f20d0d] transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={() => scrollTrending('right')}
                className="p-3 rounded-xl bg-white hover:bg-[#f1f5f9] text-[#475569] hover:text-[#f20d0d] transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Container */}
          <div 
            ref={trendingRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {trendingMovies.map((movie, index) => (
              <div 
                key={movie.id} 
                className="flex-shrink-0 w-[200px] md:w-[240px] scrollbar-hide"
                style={{ scrollSnapAlign: 'start' }}
              >
                <MovieCard
                  id={String(movie.id)}
                  title={movie.title}
                  poster={movie.poster_url || movie.thumbnail || ''}
                  rating={Number(movie.rating) || 0}
                  year={movie.release_year || 0}
                  genre={getCategoryName(movie)}
                  rank={index + 1}
                />
              </div>
            ))}
          </div>

          {/* View All Link */}
          <div className="mt-8 text-center">
            <Link 
              href="/pages/trending" 
              className="inline-flex items-center gap-2 text-[#f20d0d] hover:text-[#d90a0a] font-semibold transition-colors"
            >
              Xem tất cả phim xu hướng
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-[1920px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="accent-bar" />
              <div>
                <span className="label-caps text-[#f20d0d]">Editor's Choice</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mt-1">
                  Phim nổi bật
                </h2>
              </div>
            </div>
            <Link 
              href="/pages/categories" 
              className="hidden md:inline-flex items-center gap-2 text-[#475569] hover:text-[#f20d0d] font-medium transition-colors"
            >
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Movie Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
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

          {/* Mobile View All */}
          <div className="mt-8 text-center md:hidden">
            <Link 
              href="/pages/categories" 
              className="inline-flex items-center gap-2 text-[#f20d0d] hover:text-[#d90a0a] font-semibold transition-colors"
            >
              Xem tất cả
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Quick Access */}
      <section className="py-20 px-6 lg:px-8 bg-[#f8f9fa]">
        <div className="max-w-[1920px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="accent-bar" />
            <div>
              <span className="label-caps text-[#f20d0d]">Browse By</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mt-1">
                Khám phá thể loại
              </h2>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'Hành Động', icon: '🔥', color: 'bg-red-50 text-red-600 hover:bg-red-100' },
              { name: 'Hài Hước', icon: '😂', color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' },
              { name: 'Tình Cảm', icon: '💕', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
              { name: 'Kinh Dị', icon: '👻', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
              { name: 'Khoa Học', icon: '🚀', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { name: 'Chiến Tranh', icon: '⚔️', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
              { name: 'Phiêu Lưu', icon: '🌟', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
              { name: 'Thần Thoại', icon: '🧙', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/pages/categories?category=${encodeURIComponent(category.name)}`}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${category.color}`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Releases Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-[1920px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="accent-bar" />
              <div>
                <span className="label-caps text-[#f20d0d]">Fresh Content</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mt-1">
                  Phim mới cập nhật
                </h2>
              </div>
            </div>
            <Link 
              href="/pages/categories?category=all" 
              className="hidden md:inline-flex items-center gap-2 text-[#475569] hover:text-[#f20d0d] font-medium transition-colors"
            >
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Movie Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {newMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={String(movie.id)}
                title={movie.title}
                poster={movie.poster_url || movie.thumbnail || ''}
                rating={Number(movie.rating) || 0}
                year={movie.release_year || 0}
                genre={getCategoryName(movie)}
                isNew={true}
              />
            ))}
          </div>

          {/* Mobile View All */}
          <div className="mt-8 text-center md:hidden">
            <Link 
              href="/pages/categories?category=all" 
              className="inline-flex items-center gap-2 text-[#f20d0d] hover:text-[#d90a0a] font-semibold transition-colors"
            >
              Xem tất cả
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f20d0d] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#f20d0d] rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            Trải nghiệm <span className="text-[#f20d0d]">điện ảnh</span> đỉnh cao
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Khám phá hàng ngàn bộ phim chất lượng cao với giao diện hiện đại, mượt mà.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pages/categories"
              className="inline-flex items-center gap-3 bg-[#f20d0d] hover:bg-[#d90a0a] text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(242,13,13,0.5)]"
            >
              Khám phá ngay
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
