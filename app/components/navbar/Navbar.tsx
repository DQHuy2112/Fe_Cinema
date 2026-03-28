'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAdmin, logout, isLoading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/cinemax-logo.png"
              alt="CinemaX"
              className="h-14 md:h-16 w-auto"
            />
            <span className="text-white font-bold text-xl hidden sm:block ml-2">CinemaX</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white hover:text-red-500 transition-colors">
              Trang chủ
            </Link>
            <Link href="/pages/trending" className="text-white hover:text-red-500 transition-colors">
              Phim xu hướng
            </Link>
            <Link href="/pages/categories" className="text-white hover:text-red-500 transition-colors">
              Thể loại
            </Link>
            <Link href="/pages/search" className="text-white hover:text-red-500 transition-colors">
              Tìm kiếm
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-red-500 hover:text-red-400 transition-colors font-medium">
                Admin
              </Link>
            )}
          </div>

          {/* Search & User */}
          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-white hover:text-red-500 transition-colors p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* User Menu */}
            {!isLoading && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    {user ? (
                      <span className="text-white text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl py-2 border border-gray-800">
                    {user ? (
                      <>
                        <Link
                          href="/pages/profile"
                          className="block px-4 py-2 text-white hover:bg-gray-800 transition-colors"
                        >
                          Hồ sơ
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-red-500 hover:bg-gray-800 transition-colors"
                          >
                            Quản trị
                          </Link>
                        )}
                        <hr className="my-2 border-gray-800" />
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-800 transition-colors"
                        >
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/pages/auth"
                        className="block px-4 py-2 text-white hover:bg-gray-800 transition-colors"
                      >
                        Đăng nhập
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white hover:text-red-500 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                className="w-full bg-gray-900 text-white px-4 py-3 pl-12 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-800 pt-4">
            <Link href="/" className="block py-2 text-white hover:text-red-500 transition-colors">
              Trang chủ
            </Link>
            <Link href="/pages/trending" className="block py-2 text-white hover:text-red-500 transition-colors">
              Phim xu hướng
            </Link>
            <Link href="/pages/categories" className="block py-2 text-white hover:text-red-500 transition-colors">
              Thể loại
            </Link>
            <Link href="/pages/search" className="block py-2 text-white hover:text-red-500 transition-colors">
              Tìm kiếm
            </Link>
            {isAdmin && (
              <Link href="/admin" className="block py-2 text-red-500 hover:text-red-400 transition-colors">
                Quản trị
              </Link>
            )}
            {user ? (
              <>
                <Link href="/pages/profile" className="block py-2 text-white hover:text-red-500 transition-colors">
                  Hồ sơ
                </Link>
                <button onClick={logout} className="block w-full text-left py-2 text-red-500 hover:text-red-400 transition-colors">
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link href="/pages/auth" className="block py-2 text-white hover:text-red-500 transition-colors">
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
