import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DANNPTUD Cinema - Xem phim trực tuyến",
  description: "Nền tảng xem phim trực tuyến hàng đầu Việt Nam. Thưởng thức hàng ngàn bộ phim chất lượng cao với giao diện hiện đại.",
  icons: {
    icon: "/cinemax-logo.png",
  },
};

const VIDEO_DOMAINS =
  "https://www.2embed.cc https://2embed.cc https://2embed.to " +
  "https://vidsrc.xyz https://vidsrc.me https://vidsrc.to https://vidsrc.mov " +
  "https://www.youtube.com https://youtube.com https://drive.google.com https://docs.google.com";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={`frame-src 'self' ${VIDEO_DOMAINS} https:; media-src 'self' blob: data: ${VIDEO_DOMAINS} https:;`}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
