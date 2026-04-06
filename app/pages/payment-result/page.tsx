'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { vipApi } from '@/app/lib/api';

type VipSyncState = 'idle' | 'syncing' | 'ok' | 'error' | 'skipped';

const RESPONSE_LABELS: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Giao dịch bị trừ tiền trên HSBC',
  '09': 'Giao dịch bị lỗi',
  '10': 'Giao dịch bị lỗi',
  '11': 'Giao dịch bị lỗi',
  '12': 'Giao dịch bị lỗi',
  '13': 'Giao dịch bị lỗi',
  '24': 'Giao dịch bị lỗi',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản đã vượt hạn mức',
  '75': 'Ngân hàng đang bảo trì',
  '79': 'Sai mật khẩu thanh toán quá số lần cho phép',
  '99': 'Lỗi không xác định',
};

const MOMO_RESPONSE_LABELS: Record<string, string> = {
  '0': 'Giao dịch thành công',
  '1006': 'Giao dịch bị lỗi - Liên hệ MoMo',
  '1001': 'Giao dịch bị lỗi - Sai thông tin',
  '99': 'Người dùng hủy giao dịch',
};

function getMessage(code: string): string {
  if (!code) {
    return 'Không đọc được mã kết quả từ URL. Kiểm tra cấu hình return URL (MoMo/VNPay).';
  }
  return RESPONSE_LABELS[code] || MOMO_RESPONSE_LABELS[code] || `Mã lỗi: ${code}`;
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [txnRef, setTxnRef] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [vipSync, setVipSync] = useState<VipSyncState>('idle');
  const momoSyncStarted = useRef(false);

  useEffect(() => {
    // 1) Backend đã xử lý momo-return rồi redirect sang đây (có tiền tố momo_)
    const momoResultCode = searchParams.get('momo_resultCode');
    const momoOrderId = searchParams.get('momo_orderId');
    const momoAmount = searchParams.get('momo_amount');

    // 2) VNPay
    const respCode = searchParams.get('vnp_ResponseCode');
    const tRef = searchParams.get('vnp_TxnRef');
    const amt = searchParams.get('vnp_Amount');
    const bCode = searchParams.get('vnp_BankCode');

    // 3) MoMo redirect thẳng tới frontend (MOMO_RETURN_URL = /pages/payment-result):
    //    query gốc là resultCode, orderId, amount, partnerCode, payType, … — không có momo_
    const momoDirectCode = searchParams.get('resultCode');
    const momoPartner = searchParams.get('partnerCode');

    if (momoResultCode !== null) {
      setCode(momoResultCode);
      setTxnRef(momoOrderId);
      setAmount(momoAmount);
      setBankCode('MoMo');
    } else if (respCode !== null) {
      setCode(respCode);
      setTxnRef(tRef);
      setAmount(amt ? String(Number(amt) / 100) : null);
      setBankCode(bCode);
    } else if (momoDirectCode !== null && respCode === null) {
      setCode(momoDirectCode);
      setTxnRef(searchParams.get('orderId'));
      setAmount(searchParams.get('amount'));
      const payType = searchParams.get('payType');
      setBankCode(
        payType === 'napas'
          ? 'MoMo (thẻ ATM Napas)'
          : payType === 'credit'
            ? 'MoMo (thẻ quốc tế)'
            : momoPartner
              ? `MoMo (${momoPartner})`
              : 'MoMo'
      );
    }

    setLoaded(true);
  }, [searchParams]);

  /* MoMo redirect thẳng → backend không chạy momo-return; đồng bộ VIP có chữ ký URL */
  useEffect(() => {
    if (!loaded || momoSyncStarted.current) return;

    const success = code === '0' || code === '00';
    if (!success) {
      setVipSync('skipped');
      return;
    }

    const isBackendMomoRedirect = searchParams.get('momo_resultCode') !== null;
    const isVnpay = searchParams.get('vnp_ResponseCode') !== null;
    const isDirectMoMo =
      searchParams.get('resultCode') !== null && !isVnpay && !isBackendMomoRedirect;

    if (!isDirectMoMo) {
      setVipSync('skipped');
      return;
    }

    const signature = searchParams.get('signature');
    if (!signature) {
      setVipSync('error');
      return;
    }

    if (!token) {
      setVipSync('error');
      return;
    }

    momoSyncStarted.current = true;
    setVipSync('syncing');

    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    vipApi
      .confirmMoMoReturn(token, query)
      .then(() => setVipSync('ok'))
      .catch(() => setVipSync('error'));
  }, [loaded, code, token, searchParams]);

  const isSuccess = code === '00' || code === '0' || code === '07';

  const needsMoMoClientSync =
    isSuccess &&
    searchParams.get('resultCode') !== null &&
    searchParams.get('vnp_ResponseCode') === null &&
    searchParams.get('momo_resultCode') === null;

  const successSubtitle = (() => {
    if (!isSuccess) return getMessage(code || '');
    if (needsMoMoClientSync) {
      if (vipSync === 'error') {
        return 'Thanh toán đã thành công trên MoMo. Nếu VIP chưa lên, hãy đăng nhập đúng tài khoản đã mua gói rồi tải lại trang này, hoặc mở trang VIP. Bạn cũng có thể đặt MOMO_RETURN_URL trỏ về API `/api/vip/payment/momo-return` để kích hoạt tự động.';
      }
      if (vipSync === 'ok' || vipSync === 'skipped') {
        return 'Cảm ơn bạn! Gói VIP đã được kích hoạt. Hãy kiểm tra trang VIP để xem thời hạn.';
      }
      return 'Đang xác nhận thanh toán và kích hoạt VIP trên hệ thống…';
    }
    return 'Cảm ơn bạn! Gói VIP đã được kích hoạt. Hãy kiểm tra trang VIP để xem thời hạn.';
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#0f172a] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {loaded ? (
          <div className="bg-white rounded-3xl p-10 shadow-2xl text-center animate-scale-in">
            {/* Icon */}
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
                isSuccess
                  ? 'bg-green-100'
                  : code === '97'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              {isSuccess ? (
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h1
              className={`text-2xl font-black mb-3 ${
                isSuccess ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>

            <p className="text-[#64748b] text-sm mb-8">{successSubtitle}</p>

            {/* Details */}
            <div className="bg-[#f8fafc] rounded-2xl p-5 text-left space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Mã giao dịch</span>
                <span className="font-semibold text-[#0f172a] font-mono">{txnRef || '—'}</span>
              </div>
              {amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Số tiền</span>
                  <span className="font-semibold text-[#f20d0d]">
                    {new Intl.NumberFormat('vi-VN').format(Number(amount))}đ
                  </span>
                </div>
              )}
              {bankCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Ngân hàng</span>
                  <span className="font-semibold text-[#0f172a]">{bankCode}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Trạng thái</span>
                <span className={`font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {code}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="/pages/vip"
                className="w-full py-4 bg-[#f20d0d] text-white font-bold rounded-2xl hover:bg-[#d90a0a] transition-colors"
              >
                Kiểm tra VIP của tôi
              </Link>
              <Link
                href="/"
                className="w-full py-4 bg-[#f1f5f9] text-[#475569] font-semibold rounded-2xl hover:bg-[#e2e8f0] transition-colors"
              >
                Quay về trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 shadow-2xl text-center">
            <div className="w-10 h-10 border-4 border-[#e2e8f0] border-t-[#f20d0d] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#64748b]">Đang xử lý kết quả thanh toán…</p>
          </div>
        )}
      </div>
    </div>
  );
}
