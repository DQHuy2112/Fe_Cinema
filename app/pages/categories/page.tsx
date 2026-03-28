'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';
import { categoryApi, movieApi } from '@/app/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Movie {
  id: number;
  title: string;
  slug: string;
  thumbnail?: string;
  description?: string;
  duration?: number;
  release_year?: number;
  rating?: number;
  views: number;
  categories?: Category[];
}

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGenre, setSelectedGenre] = useState(categorySlug || 'all');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categorySlug) {
      setSelectedGenre(categorySlug);
    }
  }, [categorySlug]);

  const fetchMovies = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      let data: Movie[];
      
      if (selectedGenre === 'all') {
        data = await movieApi.getMovies({ 
          limit: 20, 
          page: pageNum,
          sortBy: 'created_at', 
          order: 'DESC' 
        });
      } else {
        const result = await categoryApi.getMoviesByCategory(selectedGenre, { 
          limit: 20, 
          page: pageNum 
        });
        data = result?.length ? result : [];
      }

      if (reset) {
        setMovies(data || []);
      } else {
        setMovies(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore(data && data.length === 20);
      setTotal(data?.length || 0);
    } catch (err: any) {
      console.error('Error fetching movies:', err);
      setError(err.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchMovies(1, true);
  }, [selectedGenre]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const getCategoryName = (movie: Movie) => {
    if (movie.categories && movie.categories.length > 0) {
      return movie.categories[0].name;
    }
    return 'Phim';
  };

  const currentCategoryName = selectedGenre === 'all' 
    ? 'Tất cả' 
    : categories.find(c => c.slug === selectedGenre)?.name || 'Phim';

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=1920&h=600&fit=crop"
            alt="Categories"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-[1920px] mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Thể Loại Phim
            </h1>
            <p className="text-gray-300 text-lg">
              Khám phá phim theo thể loại yêu thích của bạn
            </p>
          </div>
        </div>
      </section>

      {/* Genres List */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                selectedGenre === 'all' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedGenre(category.slug)}
                className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                  selectedGenre === category.slug 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-xl">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {currentCategoryName} ({movies.length} phim)
                </h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={String(movie.id)}
                    title={movie.title}
                    poster={movie.thumbnail || ''}
                    rating={Number(movie.rating) || 0}
                    year={movie.release_year || 0}
                    genre={getCategoryName(movie)}
                  />
                ))}
              </div>

              {/* Loading */}
              {loading && (
                <div className="text-center py-8">
                  <div className="text-white">Đang tải...</div>
                </div>
              )}

              {/* No results */}
              {!loading && movies.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Không có phim nào trong thể loại này.</p>
                </div>
              )}

              {/* Load More */}
              {hasMore && !loading && movies.length > 0 && (
                <div className="text-center mt-12">
                  <button 
                    onClick={handleLoadMore}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
