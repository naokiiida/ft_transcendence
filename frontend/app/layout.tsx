import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google";
import { Providers } from "@/components/providers";
import { Logo } from "@/components/shared/logo";
import { OnlineIndicator } from "@/components/shared/online-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import "./globals.css";

const dotGothic16 = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  preload: true,
});

export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "Pong multiplayer game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body className={dotGothic16.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen">
            {/* 全ページ共通ヘッダー */}
            <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <Link href="/" className="flex items-center">
                  <Logo size="sm" />
                </Link>
                <Link
                  href="/user"
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-primary/40">
                      <AvatarImage src="" alt="KIRIN-01" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        KR
                      </AvatarFallback>
                    </Avatar>
                    {/* オンライン表示のドット */}
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                      <OnlineIndicator
                        status="online"
                        size="sm"
                        showTooltip={false}
                      />
                    </span>
                  </div>
                  <span className="hidden text-muted-foreground sm:inline">
                    KIRIN-01
                  </span>
                </Link>
              </div>
            </header>
            {/* ページ本体 */}
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
