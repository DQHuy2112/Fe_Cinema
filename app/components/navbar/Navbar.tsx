'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useLiveSearch } from '@/app/context/LiveSearchContext';
import { useRouter, usePathname } from 'next/navigation';
import { movieApi } from '@/app/lib/api';
import { posterSrc } from '@/app/lib/movieUtils';

type SearchHit = {
  id: number;
  title: string;
  poster_url?: string;
  thumbnail?: string;
  release_year?: number;
};

function getAvatarSrc(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (typeof window !== 'undefined') {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8080';
    return `${base}${avatar}`;
  }
  return `http://127.0.0.1:8080${avatar}`;
}

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/pages/trending', label: 'Xu hướng' },
  { href: '/pages/categories', label: 'Thể loại' },
  { href: '/pages/search', label: 'Tìm kiếm' },
] as const;

function isActiveHref(href: string, currentPath: string): boolean {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}

function NavAvatarButton({
  user,
  isOpen,
  onToggle,
  scrolled,
}: {
  user: { username: string; avatar?: string | null; email?: string } | null;
  isOpen: boolean;
  onToggle: () => void;
  scrolled: boolean;
}) {
  const avatarSrc = user ? getAvatarSrc(user.avatar as string | undefined) : null;
  const initial = user?.username?.charAt(0)?.toUpperCase() ?? null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#f20d0d]/50 ${avatarSrc
        ? 'ring-0'
        : user
          ? 'bg-[#f20d0d] text-white'
          : scrolled
            ? 'bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] hover:bg-[#e2e8f0]'
            : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
        }`}
      aria-label="Tài khoản"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {user && avatarSrc ? (
        <img
          src={avatarSrc}
          alt={user.username}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement as HTMLDivElement;
            parent.className = 'flex items-center justify-center w-10 h-10 rounded-full bg-[#f20d0d] text-white text-sm font-bold';
            parent.textContent = initial || '?';
          }}
        />
      ) : user ? (
        <span>{initial}</span>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchHitsLoading, setSearchHitsLoading] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { liveQuery, setLiveQuery, clearLiveQuery } = useLiveSearch();
  const { user, isAdmin, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPaymentResult = pathname === '/pages/payment-result';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchHits([]);
      return;
    }
    const q = liveQuery.trim();
    if (!q) {
      setSearchHits([]);
      setSearchHitsLoading(false);
      return;
    }

    let cancelled = false;
    setSearchHitsLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const data = await movieApi.searchMovies(q);
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setSearchHits(list.slice(0, 10) as SearchHit[]);
      } catch {
        if (!cancelled) setSearchHits([]);
      } finally {
        if (!cancelled) setSearchHitsLoading(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [liveQuery, isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (searchToggleRef.current?.contains(t)) return;
      const el = searchPanelRef.current;
      if (el && !el.contains(t)) {
        setIsSearchOpen(false);
        clearLiveQuery();
        setSearchHits([]);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        clearLiveQuery();
        setSearchHits([]);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [isSearchOpen, clearLiveQuery]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const el = userMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [isUserMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveQuery.trim()) {
      router.push(`/pages/search?q=${encodeURIComponent(liveQuery.trim())}`);
      setIsSearchOpen(false);
      clearLiveQuery();
    }
  };

  if (isPaymentResult) return null;

  const scrolled = isScrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_24px_rgba(0,0,0,0.08)]'
          : 'bg-gradient-to-b from-black/60 to-transparent'
        }`}
    >
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 md:h-[4.5rem]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Trang chủ Cinemax">
            <div className="relative">
              <Image
                src="/cinemax-logo.png"
                alt="DANNPTUD Cinema"
                width={260}
                height={58}
                className={`h-12 md:h-14 w-auto object-contain transition-all duration-300 ${scrolled ? 'brightness-0 invert-0' : 'brightness-[1.2]'
                  }`}
                priority
              />
            </div>
            <span className={`hidden lg:block font-black text-xl tracking-tight ${scrolled ? 'text-[#f20d0d]' : 'text-white'
              }`}>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActiveHref(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-full ${active
                      ? scrolled ? 'text-[#f20d0d]' : 'text-white'
                      : scrolled
                        ? 'text-[#64748b] hover:text-[#f20d0d]'
                        : 'text-white/70 hover:text-white'
                    }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#f20d0d]" />
                  )}
                </Link>
              );
            })}

            <Link
              href="/pages/vip"
              className={`ml-2 px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 ${scrolled
                  ? 'bg-[#f20d0d] text-white hover:bg-[#d90a0a] shadow-[0_4px_14px_rgba(242,13,13,0.35)]'
                  : 'bg-[#f20d0d] text-white hover:bg-[#d90a0a] shadow-[0_4px_20px_rgba(242,13,13,0.5)]'
                }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              VIP
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${scrolled
                    ? 'text-[#64748b] hover:text-[#f20d0d]'
                    : 'text-white/70 hover:text-white'
                  }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Search */}
            <button
              ref={searchToggleRef}
              type="button"
              onClick={() => {
                setIsSearchOpen((o) => !o);
                setIsUserMenuOpen(false);
                setIsMobileNavOpen(false);
              }}
              className={`p-2.5 rounded-full transition-all duration-200 ${scrolled
                  ? 'text-[#64748b] hover:text-white hover:bg-[#f20d0d]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              aria-label="Tìm kiếm"
              aria-expanded={isSearchOpen}
            >
              {isSearchOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>

            {/* Auth + desktop dropdown */}
            {!isLoading && (
              <div className="relative" ref={userMenuRef}>
                <NavAvatarButton
                  user={user}
                  isOpen={isUserMenuOpen}
                  scrolled={scrolled}
                  onToggle={() => {
                    setIsUserMenuOpen((o) => !o);
                    setIsMobileNavOpen(false);
                  }}
                />
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl py-2 border border-[#e2e8f0] z-[70] animate-scale-in"
                    role="menu"
                  >
                    {user ? (
                      <React.Fragment>
                        <div className="px-4 py-3 border-b border-[#e2e8f0]">
                          <p className="text-sm font-semibold text-[#0f172a]">{user.username}</p>
                          <p className="text-xs text-[#475569] mt-0.5 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/pages/favorites"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          Phim yêu thích
                        </Link>
                        <Link
                          href="/pages/history"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Lịch sử xem
                        </Link>
                        <Link
                          href="/pages/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 text-[#475569] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Hồ sơ
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#f20d0d] hover:bg-[#fee2e2] transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Quản trị
                          </Link>
                        )}
                        <hr className="my-2 border-[#e2e8f0]" />
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-[#f20d0d] hover:bg-[#fee2e2] transition-colors"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Đăng xuất
                        </button>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <div className="px-4 py-3 border-b border-[#e2e8f0]">
                          <p className="text-sm font-medium text-[#475569]">Chào mừng!</p>
                          <p className="text-xs text-[#94a3b8] mt-0.5">Đăng nhập để trải nghiệm</p>
                        </div>
                        <Link
                          href="/pages/auth"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#f20d0d] hover:bg-[#fee2e2] transition-colors font-medium"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Đăng nhập / Đăng ký
                        </Link>
                      </React.Fragment>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile burger */}
            <button
              type="button"
              onClick={() => {
                setIsMobileNavOpen((o) => !o);
                setIsUserMenuOpen(false);
              }}
              className={`md:hidden p-2.5 rounded-full transition-all duration-200 ${scrolled
                  ? 'text-[#64748b] hover:text-white hover:bg-[#f20d0d]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              aria-label="Menu"
              aria-expanded={isMobileNavOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Search panel */}
        {isSearchOpen && (
          <div ref={searchPanelRef} className="pb-4 animate-fade-in">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={liveQuery}
                onChange={(e) => setLiveQuery(e.target.value)}
                placeholder="Tìm kiếm phim yêu thích..."
                className={`w-full px-5 py-4 pl-14 rounded-2xl border-2 transition-all duration-300 outline-none text-base ${scrolled
                    ? 'bg-[#f8fafc] text-[#0f172a] border-[#e2e8f0] focus:border-[#f20d0d] focus:bg-white'
                    : 'bg-white/15 backdrop-blur-md text-white border-white/20 focus:border-[#f20d0d] focus:bg-black/40 placeholder:text-white/50'
                  }`}
                autoFocus
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={liveQuery.trim().length > 0}
                aria-controls="navbar-search-suggestions"
              />
              <svg
                className={`w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none ${scrolled ? 'text-[#94a3b8]' : 'text-white/60'
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#f20d0d] rounded-xl text-white hover:bg-[#d90a0a] transition-colors shadow-[0_4px_12px_rgba(242,13,13,0.35)]"
                aria-label="Tìm kiếm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              {liveQuery.trim().length > 0 && (
                <div
                  id="navbar-search-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl bg-white shadow-2xl border border-[#e2e8f0] max-h-[min(70vh,420px)] overflow-y-auto overflow-x-hidden z-[60]"
                >
                  {searchHitsLoading ? (
                    <div className="flex items-center gap-3 px-4 py-4 text-sm text-[#64748b]">
                      <span className="inline-block w-5 h-5 border-2 border-[#e2e8f0] border-t-[#f20d0d] rounded-full animate-spin shrink-0" />
                      Đang tìm phim…
                    </div>
                  ) : searchHits.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[#64748b]">
                      Không có phim phù hợp. Thử từ khóa khác hoặc nhấn tìm để xem trang kết quả.
                    </div>
                  ) : (
                    <ul className="py-2">
                      {searchHits.map((m) => (
                        <li key={m.id} role="option">
                          <Link
                            href={`/pages/movie/${m.id}`}
                            onClick={() => {
                              setIsSearchOpen(false);
                              clearLiveQuery();
                              setSearchHits([]);
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#f8fafc] transition-colors"
                          >
                            <img
                              src={posterSrc(m.poster_url || m.thumbnail)}
                              alt=""
                              className="w-11 h-16 object-cover rounded-lg bg-[#e2e8f0] shrink-0"
                              width={44}
                              height={64}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <p className="font-semibold text-[#0f172a] truncate">{m.title}</p>
                              {m.release_year && (
                                <p className="text-xs text-[#64748b] mt-0.5">{m.release_year}</p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!searchHitsLoading && liveQuery.trim().length > 0 && (
                    <div className="border-t border-[#e2e8f0] px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          const q = liveQuery.trim();
                          if (!q) return;
                          router.push(`/pages/search?q=${encodeURIComponent(q)}`);
                          setIsSearchOpen(false);
                          clearLiveQuery();
                          setSearchHits([]);
                        }}
                        className="w-full text-left text-sm font-medium text-[#f20d0d] hover:text-[#d90a0a] py-2 px-1 rounded-lg hover:bg-[#fef2f2] transition-colors"
                      >
                        Xem tất cả kết quả cho &quot;{liveQuery.trim()}&quot;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Mobile drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActiveHref(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`px-4 py-3 text-base rounded-xl transition-all duration-200 font-medium ${active
                        ? 'text-[#f20d0d] bg-[#fee2e2]'
                        : 'text-[#475569] hover:text-[#f20d0d] hover:bg-[#f1f5f9]'
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <Link
                href="/pages/vip"
                onClick={() => setIsMobileNavOpen(false)}
                className="mx-1 mt-1 px-4 py-3 text-base font-bold rounded-xl bg-[#f20d0d] text-white hover:bg-[#d90a0a] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                VIP
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="px-4 py-3 text-base rounded-xl text-[#475569] hover:text-[#f20d0d] hover:bg-[#f1f5f9] transition-colors font-medium"
                >
                  Quản trị
                </Link>
              )}

              <hr className="my-2 border-[#e2e8f0]" />

              {user ? (
                <React.Fragment>
                  <div className="px-4 py-3 border-b border-[#e2e8f0] mb-1">
                    <p className="text-sm font-semibold text-[#0f172a]">{user.username}</p>
                    {user.email && <p className="text-xs text-[#64748b] mt-0.5">{user.email}</p>}
                  </div>
                  <Link href="/pages/favorites" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-[#475569] hover:text-[#f20d0d] hover:bg-[#f1f5f9] rounded-xl flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    Phim yêu thích
                  </Link>
                  <Link href="/pages/history" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-[#475569] hover:text-[#f20d0d] hover:bg-[#f1f5f9] rounded-xl flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Lịch sử xem
                  </Link>
                  <Link href="/pages/profile" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-[#475569] hover:text-[#f20d0d] hover:bg-[#f1f5f9] rounded-xl transition-colors">
                    Hồ sơ
                  </Link>
                  <button type="button" onClick={() => { logout(); setIsMobileNavOpen(false); }} className="px-4 py-3 text-left text-[#f20d0d] hover:bg-[#fee2e2] rounded-xl transition-colors font-medium">
                    Đăng xuất
                  </button>
                </React.Fragment>
              ) : (
                <Link href="/pages/auth" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-[#f20d0d] hover:bg-[#fee2e2] rounded-xl font-semibold transition-colors">
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
