import { LegalPage } from "@/components/shared/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="プライバシーポリシー"
      lead="個人情報の取り扱いについて定めます。"
    >
      <section>
        <h2 className="text-base font-semibold">1. 取得する情報</h2>
        <p className="mt-2 text-muted-foreground">
          サービス提供に必要な範囲でユーザー情報を取得します。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold">2. 利用目的</h2>
        <p className="mt-2 text-muted-foreground">
          アカウント管理、サービス改善、サポート対応のために利用します。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold">3. 第三者提供</h2>
        <p className="mt-2 text-muted-foreground">
          法令に基づく場合を除き、第三者に提供しません。
        </p>
      </section>
    </LegalPage>
  );
}
