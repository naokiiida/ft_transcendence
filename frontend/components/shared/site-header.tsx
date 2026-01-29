"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";

// コンポーネントにわたすデータの型定義　？はこのプロパティーが省略化能であることを示す
interface SiteHeaderProps {
  userName?: string;
  avatarUrl?: string;
  userHref?: string;
}

export function SiteHeader({
  userName = "User", // デフォルト値
  avatarUrl,
  userHref = "/user",
}: SiteHeaderProps) {
  // User名の最初の（英数字）文字を大文字にして取得、例外やuserNameがない場合は"U"を使用
  /*
  漢字対応を考慮すると、将来的にはアバターを表示する。ログイン時にアバターURLを取得して
  保存する、それを参照する流れがよき。変更時には新しいURLを受け取りグローバル状態を更新する。
　ここでは当面の対応しとて、イニシャルを表示するロジックを残しておく。
  */
  const initial = userName?.trim()?.[0]?.toUpperCase() ?? "U";

  /*
  ヘッダーは、サイト全体で共通の部分で、ユーザープロフィールへのリンクを含む。
  リンクは、ヘッダー全体をクリック可能にし、ユーザーのアバターと名前を表示する。
  アバターは、アバターURLがある場合のに、画像を表示して、ない場合は、イニシャルを表示する。
  */
  return (
    <header className="border-b border-border bg-card/40 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="inline-flex items-center">
          <Logo size="sm" />
        </Link>
        <Link
          href={userHref}
          className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <Avatar className="h-8 w-8">
            {/* アバターURLがある場合は画像を表示し、ない場合はイニシャルを表示 */}
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={userName} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {/* もし、画面が小さい場合は、ユーザーページのテキストを非表示にする */}
          <span className="hidden sm:inline">ユーザーページ</span>
        </Link>
      </div>
    </header>
  );
}
