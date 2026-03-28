'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';
import { movieApi } from '@/app/lib/api';

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
  categories?: { id: number; name: string; slug: string }[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const suggestions = [
    'Avengers',
    'Spider-Man',
    'Batman',
    'Iron Man',
    'Thor',
  ];

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const data = await movieApi.searchMovies(query);
      setSearchResults(data || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Tìm kiếm thất bại');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const getCategoryName = (movie: Movie) => {
    if (movie.categories && movie.categories.length > 0) {
      return movie.categories[0].name;
    }
    return 'Phim';
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Search Header */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Tìm kiếm phim
          </h1>
          
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phim, diễn viên, đạo diễn..."
              className="w-full bg-gray-900 text-white px-6 py-4 pl-14 rounded-xl border border-gray-700 focus:border-red-500 focus:outline-none text-lg"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tìm
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      {hasSearched && (
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1920px] mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-white text-lg">Đang tìm kiếm...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg">{error}</p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Kết quả tìm kiếm cho &quot;{searchQuery}&quot;
                  </h2>
                  <span className="text-gray-400">{searchResults.length} kết quả</span>
                </div>

                {/* Movies Grid */}
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {searchResults.map((movie) => (
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
                ) : (
                  <div className="text-center py-16">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-medium text-white mb-2">Không tìm thấy kết quả</h3>
                    <p className="text-gray-400">Thử tìm kiếm với từ khóa khác</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Suggestions (only show when not searched) */}
      {!hasSearched && (
        <>
          {/* Suggestions */}
          <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-4">Tìm kiếm gợi ý</h2>
              <div className="flex flex-wrap gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Searches - This would need user context in real app */}
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-4">Tìm kiếm phổ biến</h2>
              <div className="flex flex-wrap gap-3">
                {suggestions.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
