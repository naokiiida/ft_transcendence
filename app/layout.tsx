import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
