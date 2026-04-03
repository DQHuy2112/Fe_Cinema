'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/app/lib/api';

type Step = 'email' | 'otp' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState(''); // OTP hiển thị khi demo

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.forgotPassword(email.trim());
      if (data.otp) setDemoOtp(data.otp); // lưu OTP demo để user copy
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all';

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Side */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">

          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 mb-8">
              <img src="/cinemax-logo.png" alt="DANNPTUD Cinema" className="h-16 w-auto" />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">
              {step === 'email' ? 'Quên mật khẩu' : step === 'otp' ? 'Nhập mã OTP' : 'Thành công'}
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              {step === 'email' && 'Nhập email đã đăng ký để nhận mã đặt lại mật khẩu.'}
              {step === 'otp' && 'Mã OTP đã được gửi đến email của bạn.'}
              {step === 'success' && 'Mật khẩu đã được đặt lại thành công.'}
            </p>
          </div>

          {/* Demo OTP Banner */}
          {demoOtp && step === 'otp' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wider">
                Demo — Mã OTP của bạn
              </p>
              <p className="text-3xl font-black text-blue-700 tracking-widest select-all">
                {demoOtp}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                (Trong production, mã này sẽ được gửi qua email)
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Nhập email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Nhập email đã đăng ký"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang gửi…
                  </>
                ) : (
                  'Gửi mã OTP'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Nhập OTP + mật khẩu mới */}
          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="Nhập mã 6 số"
                  className={`${inputClass} text-center text-2xl tracking-[0.3em] font-bold`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Ít nhất 6 ký tự"
                    className={`${inputClass} pr-10`}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`${inputClass} pr-10`}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang đặt lại…
                  </>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">
                Mật khẩu của bạn đã được đặt lại thành công.
              </p>
              <Link
                href="/pages/auth"
                className="inline-block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-all text-center shadow-lg shadow-red-600/25"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* Back link */}
          <p className="text-center text-gray-500">
            <Link href="/pages/auth" className="text-red-500 hover:text-red-600 font-medium">
              ← Quay lại trang đăng nhập
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side */}
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
              Khôi phục tài khoản
            </h2>
            <p className="text-gray-300 text-lg">
              Nhận lại quyền truy cập vào tài khoản của bạn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
