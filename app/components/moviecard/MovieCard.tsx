'use client';

import Link from 'next/link';
import { useState } from 'react';
import { posterSrc } from '@/app/lib/movieUtils';

interface MovieCardProps {
  id: string;
  title: string;
  poster: string;
  rating: number | string;
  year: number;
  genre?: string;
  rank?: number;
  isNew?: boolean;
}

export default function MovieCard({ id, title, poster, rating, year, genre, rank, isNew }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = posterSrc(poster);
  const ratingNum = Number(rating);
  const ratingText = Number.isFinite(ratingNum) ? ratingNum.toFixed(1) : '—';

  return (
    <Link href={`/pages/movie/${id}`} className="block">
      <div
        className="relative group cursor-pointer movie-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Poster Container */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#e2e8f0] shadow-md">
          {/* Poster Image */}
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover movie-poster transition-transform duration-500 ease-out"
            loading="lazy"
            decoding="async"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rank Badge */}
          {rank && rank <= 4 && (
            <div className={`absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' :
              rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
              rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100' :
              'bg-[#475569] text-white'
            }`}>
              {rank}
            </div>
          )}

          {/* New Badge */}
          {isNew && (
            <div className="absolute top-2 right-2 bg-[#22c55e] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
              Mới
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute bottom-2 right-2 bg-[#0f172a]/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {ratingText}
          </div>

          {/* Play Button Overlay */}
          <div className={`absolute inset-0 bg-[#f20d0d]/60 flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl transform transition-transform duration-300 hover:scale-110">
              <svg className="w-8 h-8 text-[#f20d0d] ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          {/* Quick Info on Hover */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <span>{year}</span>
              {genre && (
                <>
                  <span className="w-1 h-1 bg-white/50 rounded-full" />
                  <span className="truncate">{genre}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-4">
          <h3 className="text-[#0f172a] font-semibold text-sm truncate group-hover:text-[#f20d0d] transition-colors duration-300 leading-tight">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#475569]">
            <span>{year}</span>
            {genre && (
              <>
                <span className="w-1 h-1 bg-[#cbd5e1] rounded-full" />
                <span className="truncate">{genre}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
