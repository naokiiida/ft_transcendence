import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      {/* Legal links shared across all pages */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-center gap-6 px-4 text-sm text-muted-foreground">
        <Link href="/terms" className="transition-colors hover:text-primary">
          利用規約
        </Link>
        <Link href="/privacy" className="transition-colors hover:text-primary">
          プライバシーポリシー
        </Link>
      </div>
    </footer>
  );
}
