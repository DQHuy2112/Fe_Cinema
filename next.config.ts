import type { NextConfig } from "next";

/** Proxy API qua Next để tránh CORS và lỗi fetch tới localhost:8080 (IPv6/HTTPS). */
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";

/** Cho phép iframe + media (video/audio) từ 2embed, vidsrc, YouTube, Google Drive */
const VIDEO_DOMAINS =
  "https://www.2embed.cc https://2embed.cc https://2embed.to " +
  "https://vidsrc.xyz https://vidsrc.me https://vidsrc.to https://vidsrc.mov " +
  "https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com " +
  "https://drive.google.com https://docs.google.com";

const nextConfig: NextConfig = {
  /**
   * Rewrite tới backend dùng http-proxy trong Next 16: mặc định chỉ buffer ~10MB và timeout 30s.
   * Upload video admin tới 5GB + thời gian truyền dài → cần nới giới hạn proxy, không sẽ 401/reset lạ.
   */
  experimental: {
    proxyClientMaxBodySize: "5500mb",
    proxyTimeout: 900_000,
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      `frame-src 'self' ${VIDEO_DOMAINS} https:`,
      `media-src 'self' blob: data: ${VIDEO_DOMAINS} https:`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' http://127.0.0.1:8080 http://localhost:8080 https:",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
