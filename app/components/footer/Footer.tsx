import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fa] border-t border-[#e2e8f0]">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center mb-6 group">
              <Image
                src="/cinemax-logo.png"
                alt="DANNPTUD Cinema"
                width={320}
                height={72}
                className="h-16 w-auto max-w-[320px] object-contain object-left"
              />
            </Link>
            
            <p className="text-[#475569] text-base leading-relaxed mb-6 max-w-md">
              Nền tảng xem phim trực tuyến hàng đầu Việt Nam. 
              Thưởng thức hàng ngàn bộ phim chất lượng cao với trải nghiệm người dùng tuyệt vời.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#475569] hover:text-[#f20d0d] hover:bg-[#fee2e2] transition-all duration-300 shadow-sm"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#475569] hover:text-[#f20d0d] hover:bg-[#fee2e2] transition-all duration-300 shadow-sm"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#475569] hover:text-[#f20d0d] hover:bg-[#fee2e2] transition-all duration-300 shadow-sm"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#475569] hover:text-[#f20d0d] hover:bg-[#fee2e2] transition-all duration-300 shadow-sm"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#0f172a] font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#f20d0d] rounded-full" />
              Khám phá
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/pages/trending" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Phim xu hướng
                </Link>
              </li>
              <li>
                <Link href="/pages/categories" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Thể loại
                </Link>
              </li>
              <li>
                <Link href="/pages/search" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Tìm kiếm
                </Link>
              </li>
              <li>
                <Link href="/" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Phim mới
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[#0f172a] font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#f20d0d] rounded-full" />
              Hỗ trợ
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="#" className="text-[#475569] hover:text-[#f20d0d] transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-0 h-0 border-t-[4px] border-t-[#f20d0d] border-l-[4px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#e2e8f0] mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#475569] text-sm">
              © 2026 DAN<span className="text-[#f20d0d]">NPTUD</span> Cinema. Tất cả các quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-6 text-sm text-[#475569]">
              <Link href="#" className="hover:text-[#f20d0d] transition-colors">Điều khoản</Link>
              <Link href="#" className="hover:text-[#f20d0d] transition-colors">Bảo mật</Link>
              <Link href="#" className="hover:text-[#f20d0d] transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
