import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google";
import { Providers } from "@/components/providers";
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
