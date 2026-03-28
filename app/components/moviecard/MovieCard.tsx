'use client';

import Link from 'next/link';
import { useState } from 'react';
import { posterSrc } from '@/app/lib/movieUtils';

interface MovieCardProps {
  id: string;
  title: string;
  poster: string;
  rating: number;
  year: number;
  genre?: string;
}

export default function MovieCard({ id, title, poster, rating, year, genre }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = posterSrc(poster);

  return (
    <Link href={`/pages/movie/${id}`}>
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 image-rendering-auto"
            loading="lazy"
            decoding="async"
          />
          
          {/* Rating Badge */}
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {rating.toFixed(1)}
          </div>

          {/* Play Button Overlay */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3">
          <h3 className="text-white font-medium text-sm truncate group-hover:text-red-500 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-xs">{year}</span>
            {genre && (
              <>
                <span className="text-gray-600 text-xs">•</span>
                <span className="text-gray-400 text-xs">{genre}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
