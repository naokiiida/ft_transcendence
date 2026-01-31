import { LegalPage } from "@/components/shared/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="利用規約" lead="本サービスをご利用いただく際のルールです。">
      <section>
        <h2 className="text-base font-semibold">第1条（適用）</h2>
        <p className="mt-2 text-muted-foreground">
          この利用規約は、サービスの提供条件および利用者との間の権利義務関係を
          定めるものです。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold">第2条（禁止事項）</h2>
        <p className="mt-2 text-muted-foreground">
          法令に違反する行為、またはサービス運営を妨害する行為を禁止します。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold">第3条（免責事項）</h2>
        <p className="mt-2 text-muted-foreground">
          サービスの内容は予告なく変更される場合があります。
        </p>
      </section>
    </LegalPage>
  );
}
