import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import "./globals.css";

// Google Fonts の読み込み（next/fontで最適化される）。
const dotGothic16 = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  preload: true,
});

// <head> に入るメタ情報（タイトルや説明）。
export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "Pong multiplayer game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 全ページ共通のレイアウト（ヘッダー/フッター/Providers）。
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      {/* suppressHydrationWarning: SSRとCSRの差分警告を抑制 */}
      <body className={dotGothic16.className} suppressHydrationWarning>
        {/* Contextやテーマ等のProviderを全体に適用 */}
        <Providers>
          {/* 画面全体の縦レイアウト */}
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
