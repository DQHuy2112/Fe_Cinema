'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/navbar/Navbar';
import Footer from '@/app/components/footer/Footer';
import MovieCard from '@/app/components/moviecard/MovieCard';
import { useAuth } from '@/app/context/AuthContext';
import { userApi, uploadAvatar, vipApi, type VipStatus } from '@/app/lib/api';
import { posterSrc } from '@/app/lib/movieUtils';
import { useToast } from '@/app/components/toast/Toast';

interface ApiMovie {
  id: number;
  title: string;
  thumbnail?: string;
  rating?: number;
  release_year?: number;
  categories?: { id: number; name: string; slug: string }[];
}

interface ApiComment {
  id: number;
  content: string;
  rating?: number;
  created_at?: string;
  createdAt?: string;
  movie?: ApiMovie | null;
}

function mapMovieForCard(m: ApiMovie) {
  return {
    id: String(m.id),
    title: m.title,
    poster: m.thumbnail || '',
    rating: Number(m.rating) || 0,
    year: m.release_year || 0,
    genre: m.categories?.[0]?.name,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('favorites');

  const [profileLoading, setProfileLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [favorites, setFavorites] = useState<ApiMovie[]>([]);
  const [history, setHistory] = useState<ApiMovie[]>([]);
  const [myComments, setMyComments] = useState<ApiComment[]>([]);
  const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  // Remove from favorites
  const handleRemoveFavorite = async (movieId: number) => {
    if (!token) return;
    if (!confirm('Xóa phim khỏi danh sách yêu thích?')) return;
    try {
      await userApi.removeFromFavorites(token, movieId);
      setFavorites((prev) => prev.filter((m) => m.id !== movieId));
      showToast('Đã xóa khỏi yêu thích', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa thất bại', 'error');
    }
  };

  // Remove from watch history
  const handleRemoveHistory = async (movieId: number) => {
    if (!token) return;
    if (!confirm('Xóa khỏi lịch sử xem?')) return;
    try {
      await userApi.removeFromWatchHistory(token, movieId);
      setHistory((prev) => prev.filter((m) => m.id !== movieId));
      showToast('Đã xóa khỏi lịch sử xem', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa thất bại', 'error');
    }
  };

  // Clear all watch history
  const handleClearHistory = async () => {
    if (!token) return;
    if (!confirm('Xóa toàn bộ lịch sử xem?')) return;
    try {
      await Promise.all(
        history.map((m) => userApi.removeFromWatchHistory(token, m.id))
      );
      setHistory([]);
      showToast('Đã xóa toàn bộ lịch sử xem', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa thất bại', 'error');
    }
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    setLoadError(null);
    try {
      const [prof, fav, hist, comments] = await Promise.all([
        userApi.getProfile(token),
        userApi.getFavorites(token),
        userApi.getWatchHistory(token),
        userApi.getMyComments(token),
      ]);
      setUsername(prof.username ?? '');
      setEmail(prof.email ?? '');
      setAvatar(prof.avatar ?? null);
      setFavorites(Array.isArray(fav) ? fav : []);
      setHistory(Array.isArray(hist) ? hist : []);
      setMyComments(Array.isArray(comments) ? comments : []);
      try {
        const vip = await vipApi.getMyVip(token);
        setVipStatus(vip);
      } catch {
        setVipStatus({ isVip: false, status: 'none' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không tải được dữ liệu';
      setLoadError(msg);
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/pages/auth');
      return;
    }
    loadData();
  }, [authLoading, token, router, loadData]);

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await userApi.updateProfile(token, { username: username.trim(), email: email.trim() });
      if (user) {
        const u = { ...user, username: username.trim(), email: email.trim() };
        localStorage.setItem('user', JSON.stringify(u));
      }
      setSaveMessage('Đã lưu thành công.');
      window.location.reload();
    } catch (e: unknown) {
      setSaveMessage(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!token) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận ảnh: JPG, PNG, GIF, WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh tối đa 2MB');
      return;
    }
    setAvatarUploading(true);
    try {
      const { avatar: newAvatarUrl } = await uploadAvatar(file, token);
      setAvatar(newAvatarUrl);
      if (user) {
        const u = { ...user, avatar: newAvatarUrl };
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Tải ảnh đại diện thất bại');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', ok: false });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdMsg({ text: 'Mật khẩu mới và xác nhận không khớp.', ok: false });
      return;
    }

    setPwdSaving(true);
    try {
      await userApi.changePassword(token, currentPassword, newPassword);
      setPwdMsg({ text: 'Đổi mật khẩu thành công!', ok: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e: unknown) {
      setPwdMsg({ text: e instanceof Error ? e.message : 'Đổi mật khẩu thất bại.', ok: false });
    } finally {
      setPwdSaving(false);
    }
  };

  const displayName = username || user?.username || 'Người dùng';
  const displayEmail = email || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang tải…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang chuyển đến trang đăng nhập…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              {avatar ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-100">
                  <img
                    src={avatar.startsWith('http') ? avatar : `http://127.0.0.1:8080${avatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { setAvatar(null); }}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center border-4 border-red-100">
                  <span className="text-white text-5xl font-bold">{initial}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white hover:bg-gray-300 disabled:opacity-50 transition-colors"
                aria-label="Đổi ảnh đại diện"
                title="Đổi ảnh đại diện"
              >
                {avatarUploading ? (
                  <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
              <p className="text-gray-500 mb-4">{displayEmail}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="text-gray-900 font-bold text-xl">{favorites.length}</span>
                  <span className="text-gray-500 ml-2">Yêu thích</span>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="text-gray-900 font-bold text-xl">{history.length}</span>
                  <span className="text-gray-500 ml-2">Đã xem</span>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="text-gray-900 font-bold text-xl">{myComments.length}</span>
                  <span className="text-gray-500 ml-2">Bình luận</span>
                </div>
              </div>

              {/* Thành viên VIP */}
              {!profileLoading && vipStatus && (
                <div className="mt-6 w-full max-w-xl mx-auto md:mx-0">
                  {vipStatus.isVip && vipStatus.status === 'active' ? (
                    <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-4 sm:p-5 text-[#0f172a] shadow-lg border border-amber-400/50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/10">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </span>
                          <div>
                            <p className="font-bold text-lg leading-tight">Thành viên VIP</p>
                            <p className="text-sm text-[#0f172a]/80 mt-0.5">
                              {vipStatus.packageName ? `${vipStatus.packageName}` : 'Gói VIP'}
                              {typeof vipStatus.daysRemaining === 'number' && (
                                <span> · Còn {vipStatus.daysRemaining} ngày</span>
                              )}
                            </p>
                            {vipStatus.endDate && (
                              <p className="text-xs text-[#0f172a]/65 mt-1">
                                Hết hạn:{' '}
                                {new Date(vipStatus.endDate).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          href="/pages/vip"
                          className="inline-flex items-center justify-center shrink-0 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
                        >
                          Gia hạn / gói khác
                        </Link>
                      </div>
                    </div>
                  ) : vipStatus.status === 'expired' ? (
                    <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-200 text-orange-800">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">VIP đã hết hạn</p>
                            <p className="text-sm text-gray-600 mt-0.5">Gia hạn để tiếp tục xem phim VIP.</p>
                          </div>
                        </div>
                        <Link
                          href="/pages/vip"
                          className="inline-flex items-center justify-center shrink-0 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                        >
                          Gia hạn VIP
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/80 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-500">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">Chưa có VIP</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              Mua gói VIP để xem phim độc quyền và không quảng cáo.
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/pages/vip"
                          className="inline-flex items-center justify-center shrink-0 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                        >
                          Xem gói VIP
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="md:ml-auto bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto">
          <nav className="flex gap-8 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Phim yêu thích
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Lịch sử xem
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Đánh giá của tôi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Cài đặt
            </button>
          </nav>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto">
          {loadError && (
            <p className="text-red-600 mb-6">{loadError}</p>
          )}

          {profileLoading && !loadError && (
            <p className="text-gray-600">Đang tải dữ liệu hồ sơ…</p>
          )}

          {!profileLoading && activeTab === 'favorites' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Phim yêu thích</h2>
                <span className="text-gray-500 text-sm">{favorites.length} phim</span>
              </div>
              {favorites.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">Bạn chưa có phim yêu thích.</p>
                  <Link href="/" className="text-red-600 hover:underline text-sm">Khám phá phim ngay</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {favorites.map((movie) => {
                    const card = mapMovieForCard(movie);
                    return (
                      <div key={movie.id} className="relative group">
                        <MovieCard
                          id={card.id}
                          title={card.title}
                          poster={card.poster}
                          rating={card.rating}
                          year={card.year}
                          genre={card.genre}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveFavorite(movie.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                          title="Xóa khỏi yêu thích"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!profileLoading && activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Lịch sử xem</h2>
                <div className="flex items-center gap-3">
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa tất cả
                    </button>
                  )}
                  <span className="text-gray-500 text-sm">{history.length} phim</span>
                </div>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">Chưa có lịch sử xem.</p>
                  <Link href="/" className="text-red-600 hover:underline text-sm">Bắt đầu xem phim</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((movie) => (
                    <div key={movie.id} className="relative group flex gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                      <Link
                        href={`/pages/movie/${movie.id}`}
                        className="flex gap-4 flex-1 min-w-0"
                      >
                        <div className="w-28 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={posterSrc(movie.thumbnail || '')}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold text-base truncate group-hover:text-red-600 transition-colors">{movie.title}</h3>
                          <div className="flex items-center gap-3 text-gray-500 text-xs mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {Number(movie.rating) || '—'}
                            </span>
                            <span>{movie.release_year || '—'}</span>
                            <span className="line-clamp-1">{movie.categories?.[0]?.name || 'Phim'}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-blue-500 font-medium">Đã xem</span>
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/pages/watch/${movie.id}`}
                          className="hidden sm:flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Xem lại
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveHistory(movie.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa khỏi lịch sử"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!profileLoading && activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Đánh giá của tôi</h2>
              {myComments.length === 0 ? (
                <p className="text-gray-600">Bạn chưa có bình luận nào trên phim.</p>
              ) : (
                <div className="space-y-4">
                  {myComments.map((c) => {
                    const m = c.movie;
                    const poster = posterSrc(m?.thumbnail || '');
                    const created = c.created_at || c.createdAt;
                    const dateStr = created
                      ? new Date(created).toLocaleDateString('vi-VN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '';
                    return (
                      <div
                        key={c.id}
                        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          {m ? (
                            <Link href={`/pages/movie/${m.id}`}>
                              <img
                                src={poster}
                                alt={m.title}
                                className="w-16 h-24 object-cover rounded"
                                loading="lazy"
                                decoding="async"
                              />
                            </Link>
                          ) : null}
                          <div className="flex-1 min-w-0">
                            {m ? (
                              <Link href={`/pages/movie/${m.id}`} className="hover:text-red-600">
                                <h3 className="text-gray-900 font-medium">{m.title}</h3>
                              </Link>
                            ) : (
                              <h3 className="text-gray-500 font-medium">Phim đã xóa</h3>
                            )}
                            {c.rating ? (
                              <div className="flex items-center gap-0.5 text-yellow-500 mt-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < c.rating! ? 'opacity-100' : 'opacity-25'}`}
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ))}
                              </div>
                            ) : null}
                            {dateStr ? (
                              <p className="text-gray-400 text-xs mt-1">{dateStr}</p>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!profileLoading && activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Cài đặt tài khoản</h2>
              <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-gray-900 font-semibold mb-4">Thông tin cá nhân</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2" htmlFor="profile-username">
                        Tên hiển thị
                      </label>
                      <input
                        id="profile-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2" htmlFor="profile-email">
                        Email
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-gray-900 font-semibold mb-4">Bảo mật</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2" htmlFor="cur-pwd">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          id="cur-pwd"
                          type={showCurrentPwd ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full bg-gray-50 text-gray-900 px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showCurrentPwd ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2" htmlFor="new-pwd">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          id="new-pwd"
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder="Ít nhất 6 ký tự"
                          className="w-full bg-gray-50 text-gray-900 px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showNewPwd ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2" htmlFor="confirm-pwd">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-pwd"
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full bg-gray-50 text-gray-900 px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showConfirmPwd ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {pwdMsg && (
                      <p className={`text-sm font-medium ${pwdMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                        {pwdMsg.text}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={pwdSaving}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {pwdSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Đang đổi…
                        </>
                      ) : (
                        'Đổi mật khẩu'
                      )}
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-gray-900 font-semibold mb-4">Tùy chọn</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Nhận email thông báo</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 bg-gray-50 border-gray-300 rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Nhận email khuyến mãi</span>
                      <input type="checkbox" className="w-5 h-5 bg-gray-50 border-gray-300 rounded" />
                    </label>
                  </div>
                </div>

                {saveMessage && (
                  <p className={`text-sm ${saveMessage.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
                    {saveMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
