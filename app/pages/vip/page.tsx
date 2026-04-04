'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { vipApi, VipPackage, VipStatus } from '@/app/lib/api';

type MoMoSubMethod = 'captureWallet' | 'payWithATM' | 'payWithCC';
type PayMethod = 'vnpay' | 'momo';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function formatDuration(days: number): string {
  if (days === 7) return '7 ngày';
  if (days === 30) return '30 ngày';
  if (days === 365) return '365 ngày';
  return `${days} ngày`;
}

function MoMoMethodSelector({
  value,
  onChange,
  isDark,
}: {
  value: MoMoSubMethod;
  onChange: (v: MoMoSubMethod) => void;
  isDark: boolean;
}) {
  const methods: { value: MoMoSubMethod; label: string; icon: string; desc: string }[] = [
    {
      value: 'captureWallet',
      label: 'Ví MoMo',
      icon: '💎',
      desc: 'QR / App MoMo',
    },
    {
      value: 'payWithATM',
      label: 'Thẻ ATM',
      icon: '🏦',
      desc: 'Nội địa (Napas)',
    },
    {
      value: 'payWithCC',
      label: 'Thẻ quốc tế',
      icon: '💳',
      desc: 'Visa / Mastercard',
    },
  ];

  return (
    <div className="flex gap-2">
      {methods.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
            value === m.value
              ? 'border-[#a50064] bg-[#a50064]/5 text-[#a50064]'
              : `border-[#e2e8f0] ${isDark ? 'bg-white/10 text-white/70 border-white/20' : 'bg-white text-[#475569] border-[#e2e8f0]'} hover:border-[#a50064]/50`
          }`}
        >
          <span className="text-base">{m.icon}</span>
          <span className="leading-tight text-center">{m.label}</span>
          <span className={`font-normal opacity-60 ${isDark ? 'text-white/50' : 'text-[#94a3b8]'}`}>{m.desc}</span>
        </button>
      ))}
    </div>
  );
}

function PackageCard({
  pkg,
  onBuy,
  isLoading,
  isVip,
  paymentMethod,
  onPaymentMethodChange,
  momoMethod,
  onMoMoMethodChange,
}: {
  pkg: VipPackage;
  onBuy: () => void;
  isLoading: boolean;
  isVip: boolean;
  paymentMethod: PayMethod;
  onPaymentMethodChange: (m: PayMethod) => void;
  momoMethod: MoMoSubMethod;
  onMoMoMethodChange: (m: MoMoSubMethod) => void;
}) {
  const isBest = pkg.duration === 365;
  const isPopular = pkg.duration === 30;

  return (
    <div
      className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        isBest
          ? 'bg-gradient-to-br from-[#f20d0d] to-[#b30808] text-white shadow-[0_8px_40px_rgba(242,13,13,0.35)]'
          : isPopular
          ? 'bg-white text-[#0f172a] shadow-xl border-2 border-[#f20d0d]'
          : 'bg-white text-[#0f172a] shadow-lg border border-[#e2e8f0] hover:border-[#f20d0d]'
      }`}
    >
      {isBest && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-yellow-400 text-[#0f172a] text-xs font-bold px-5 py-1.5 rounded-full shadow-lg">
            TIẾT KIỆM NHẤT
          </span>
        </div>
      )}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-[#f20d0d] text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg">
            PHỔ BIẾN NHẤT
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className={`text-2xl font-bold mb-1 ${isBest ? 'text-white' : 'text-[#0f172a]'}`}>
          {pkg.name}
        </h3>
        <div className={`text-4xl font-black ${isBest ? 'text-white' : 'text-[#f20d0d]'}`}>
          {formatPrice(pkg.price)}
        </div>
        <div className={`text-sm mt-1 ${isBest ? 'text-white/80' : 'text-[#64748b]'}`}>
          {formatDuration(pkg.duration)}
        </div>
      </div>

      <div className={`text-sm space-y-2.5 mb-8 ${isBest ? 'text-white/90' : 'text-[#475569]'}`}>
        {[
          'Xem tất cả phim VIP không giới hạn',
          'Chất lượng cao 1080p',
          'Không quảng cáo',
          `Thời hạn ${formatDuration(pkg.duration)}`,
          'Hỗ trợ 24/7',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 shrink-0 ${isBest ? 'text-white' : 'text-[#f20d0d]'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Payment method selector */}
      {!isVip && (
        <div className={`mb-4 p-4 rounded-2xl ${isBest ? 'bg-white/15' : 'bg-[#f8fafc]'}`}>
          <p className={`text-xs font-semibold mb-3 ${isBest ? 'text-white/80' : 'text-[#64748b]'}`}>
            Chọn cổng thanh toán
          </p>
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => onPaymentMethodChange('vnpay')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                paymentMethod === 'vnpay'
                  ? 'border-[#f20d0d] bg-[#f20d0d]/5 text-[#f20d0d]'
                  : `border-[#e2e8f0] ${isBest ? 'bg-white/10 text-white/70 border-white/20' : 'bg-white text-[#475569] border-[#e2e8f0]'} hover:border-[#f20d0d]/50`
              }`}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/VNPAY_logo.svg" alt="VNPay" className="h-5 object-contain" />
            </button>
            <button
              type="button"
              onClick={() => onPaymentMethodChange('momo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                paymentMethod === 'momo'
                  ? 'border-[#a50064] bg-[#a50064]/5 text-[#a50064]'
                  : `border-[#e2e8f0] ${isBest ? 'bg-white/10 text-white/70 border-white/20' : 'bg-white text-[#475569] border-[#e2e8f0]'} hover:border-[#a50064]/50`
              }`}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/MoMo_Logo.png" alt="MoMo" className="h-5 object-contain" />
            </button>
          </div>

          {/* MoMo sub-method selector */}
          {paymentMethod === 'momo' && (
            <>
              <div className={`h-px mb-3 ${isBest ? 'bg-white/20' : 'bg-[#e2e8f0]'}`} />
              <p className={`text-xs font-semibold mb-2 ${isBest ? 'text-white/70' : 'text-[#94a3b8]'}`}>
                Chọn phương thức MoMo
              </p>
              <MoMoMethodSelector
                value={momoMethod}
                onChange={onMoMoMethodChange}
                isDark={isBest}
              />
            </>
          )}
        </div>
      )}

      <button
        onClick={onBuy}
        disabled={isLoading || isVip}
        className={`mt-auto w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 ${
          isBest
            ? 'bg-white text-[#f20d0d] hover:bg-yellow-400 hover:text-[#0f172a]'
            : 'bg-[#f20d0d] text-white hover:bg-[#d90a0a]'
        } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''} ${isVip ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {isVip ? 'Đã là VIP' : isLoading ? 'Đang xử lý…' : 'Mua ngay'}
      </button>
    </div>
  );
}

export default function VipPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<VipPackage[]>([]);
  const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('vnpay');
  const [momoMethod, setMoMoMethod] = useState<MoMoSubMethod>('captureWallet');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/pages/auth?redirect=/pages/vip');
      return;
    }
    if (!authLoading && user) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function loadData() {
    try {
      const [pkgs, status] = await Promise.all([
        vipApi.getPackages(),
        token ? vipApi.getMyVip(token) : Promise.resolve({ isVip: false, status: 'none' as const }),
      ]);
      setPackages(pkgs);
      setVipStatus(status);
    } catch {
      setError('Không thể tải danh sách gói VIP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(pkg: VipPackage) {
    if (!token) {
      router.push('/pages/auth?redirect=/pages/vip');
      return;
    }
    setPurchasing(pkg.id);
    setError(null);
    try {
      let paymentUrl: string;
      if (paymentMethod === 'momo') {
        const result = await vipApi.createMoMoPayment(token, pkg.id, momoMethod);
        paymentUrl = result.paymentUrl;
      } else {
        const result = await vipApi.createPayment(token, pkg.id);
        paymentUrl = result.paymentUrl;
      }
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
      setPurchasing(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#0f172a] pt-32 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#f20d0d]/20 border border-[#f20d0d]/30 rounded-full px-5 py-2 mb-6">
            <svg className="w-4 h-4 text-[#f20d0d]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[#f20d0d] text-sm font-semibold">VIP MEMBERSHIP</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Trở thành <span className="text-[#f20d0d]">VIP</span> ngay hôm nay
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Mở khóa toàn bộ kho phim VIP chất lượng cao, không quảng cáo, xem không giới hạn với giá cực kỳ ưu đãi.
          </p>
        </div>
      </div>

      {/* VIP Status Banner */}
      {vipStatus?.isVip && (
        <div className="max-w-7xl mx-auto px-6 -mt-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Bạn đang là VIP</p>
                <p className="text-white/80 text-sm">
                  {vipStatus.packageName} — còn {vipStatus.daysRemaining} ngày
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Hết hạn</p>
              <p className="text-white font-semibold text-sm">
                {vipStatus.endDate
                  ? new Date(vipStatus.endDate).toLocaleDateString('vi-VN')
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Package Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-[#0f172a] mb-3">Chọn gói VIP phù hợp với bạn</h2>
          <p className="text-[#64748b] text-base">Tất cả gói đều có quyền truy cập đầy đủ kho phim VIP</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#e2e8f0] border-t-[#f20d0d] rounded-full animate-spin" />
          </div>
        ) : error && packages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#f20d0d] font-medium mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-3 bg-[#f20d0d] text-white rounded-xl font-semibold hover:bg-[#d90a0a] transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 max-w-lg mx-auto">
            <p className="text-[#64748b] mb-4">
              Hiện chưa có gói VIP nào đang mở bán. Vui lòng thử lại sau hoặc liên hệ quản trị viên.
            </p>
            <button
              type="button"
              onClick={loadData}
              className="px-6 py-3 bg-[#f20d0d] text-white rounded-xl font-semibold hover:bg-[#d90a0a] transition-colors"
            >
              Tải lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onBuy={() => handleBuy(pkg)}
                isLoading={purchasing === pkg.id}
                isVip={vipStatus?.isVip === true}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                momoMethod={momoMethod}
                onMoMoMethodChange={setMoMoMethod}
              />
            ))}
          </div>
        )}

        {error && packages.length > 0 && (
          <p className="text-center text-[#f20d0d] text-sm mt-4">{error}</p>
        )}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h3 className="text-2xl font-bold text-[#0f172a] mb-8 text-center">Câu hỏi thường gặp</h3>
        <div className="space-y-4">
          {[
            {
              q: 'VIP có tự động gia hạn không?',
              a: 'Không. Bạn cần mua lại gói VIP sau khi hết hạn. Nếu mua trong thời gian còn VIP, thời hạn sẽ được cộng thêm.',
            },
            {
              q: 'Thanh toán qua những phương thức nào?',
              a: 'Hiện tại hỗ trợ thanh toán qua VNPAY (20+ ngân hàng) và MoMo (ví MoMo / thẻ ATM / thẻ quốc tế Visa-Mastercard).',
            },
            {
              q: 'Làm sao biết tôi đã là VIP?',
              a: 'Sau khi thanh toán thành công, trạng thái VIP sẽ được kích hoạt tức thì. Bạn có thể kiểm tra tại trang VIP.',
            },
            {
              q: 'Phim VIP là gì?',
              a: 'Phim VIP là những bộ phim đặc biệt, thường là các bộ phim mới nhất hoặc có chất lượng cao, chỉ dành cho thành viên VIP.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
              <h4 className="font-semibold text-[#0f172a] mb-2">{item.q}</h4>
              <p className="text-sm text-[#64748b] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
