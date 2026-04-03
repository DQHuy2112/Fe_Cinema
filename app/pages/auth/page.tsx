'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

/** Tính độ mạnh mật khẩu (0–4) */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-red-500' };
  if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-yellow-500' };
  if (score === 3) return { score: 3, label: 'Khá', color: 'bg-blue-500' };
  return { score: 4, label: 'Mạnh', color: 'bg-green-500' };
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [password, setPassword] = useState('');
  const { login, register: registerUser } = useAuth();
  const router = useRouter();

  // Redirect nếu đã đăng nhập
  const { user } = useAuth();
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;

    if (isLogin) {
      setLoading(true);
      const result = await login(email, password);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.message);
      }
      setLoading(false);
    } else {
      const username = formData.get('username') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (!username || username.trim().length < 3) {
        setError('Tên người dùng phải có ít nhất 3 ký tự');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      setLoading(true);
      const result = await registerUser(username.trim(), email.trim(), password);
      setLoading(false);

      if (result.success) {
        setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => router.push('/'), 1500);
      } else {
        setError(result.message);
      }
    }
  };

  const handleSocialLogin = () => {
    setError('Đăng nhập mạng xã hội đang được phát triển. Vui lòng đăng nhập bằng tài khoản.');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 mb-8">
              <img
                src="/cinemax-logo.png"
                alt="DANNPTUD Cinema"
                className="h-16 w-auto"
              />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h2>
            <p className="mt-2 text-gray-500">
              {isLogin
                ? 'Đăng nhập để theo dõi phim yêu thích'
                : 'Tạo tài khoản để trải nghiệm tốt hơn'}
            </p>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMsg}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Social Login */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSocialLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-lg transition-colors border border-gray-300 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Tiếp tục với Google
            </button>

            <button
              type="button"
              onClick={handleSocialLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-lg transition-colors border border-gray-300 shadow-sm"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
              </svg>
              Tiếp tục với Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-100 text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Username — chỉ hiện khi đăng ký */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên người dùng
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Nhập tên người dùng"
                  className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Email (đăng ký) / Email hoặc username (đăng nhập) — API vẫn dùng field `email` */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isLogin ? 'Email hoặc tên đăng nhập' : 'Email'}
              </label>
              <input
                name="email"
                type={isLogin ? 'text' : 'email'}
                required
                autoComplete={isLogin ? 'username' : 'email'}
                minLength={isLogin ? 3 : undefined}
                maxLength={isLogin ? 100 : undefined}
                placeholder={
                  isLogin
                    ? 'Nhập email hoặc tên đăng nhập'
                    : 'Nhập địa chỉ email'
                }
                className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white text-gray-900 px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
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
              {/* Password Strength Meter */}
              {!isLogin && password && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= level ? strength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-yellow-600' : strength.score === 3 ? 'text-blue-500' : 'text-green-600'}`}>
                      Độ mạnh: {strength.label}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Confirm Password — chỉ hiện khi đăng ký */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full bg-white text-gray-900 px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
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
            )}

            {/* Remember me + Forgot password — chỉ hiện khi đăng nhập */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 bg-white border-gray-300 rounded text-red-500 focus:ring-red-500" />
                  <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link href="/pages/forgot-password" className="text-sm text-red-500 hover:text-red-600 font-medium">
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                </>
              ) : (
                isLogin ? 'Đăng nhập' : 'Tạo tài khoản'
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <p className="text-center text-gray-500">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); setPassword(''); }}
              className="text-red-500 hover:text-red-600 font-medium"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&h=1080&fit=crop"
          alt="Movie"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <img
              src="/cinemax-logo.png"
              alt="DANNPTUD Cinema"
              className="h-20 w-auto mx-auto mb-6 brightness-0 invert"
            />
            <h2 className="text-4xl font-bold text-white mb-4">
              Xem phim không giới hạn
            </h2>
            <p className="text-gray-300 text-lg">
              Thưởng thức hàng ngàn bộ phim chất lượng cao
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
