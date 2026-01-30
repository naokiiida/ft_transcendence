"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/components/auth/user-context";

type RegisterPayload = {
  email: string;
  password: string;
  display_name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUserFromApi, setUser } = useUser();
  // フォーム状態、エラー状態、ペンディング状態の管理
  const [form, setForm] = useState<RegisterPayload>({
    email: "",
    password: "",
    display_name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // フォーム入力変更時の処理
  const handleChange =
    (key: keyof RegisterPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  // フォーム送信時の処理
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // フォームのデフォルト送信を防止(ページのリロードを防ぎ、react側で通信を処理するため)
    event.preventDefault();
    // エラー状態をクリアし、ペンディング状態に設定
    setError(null);
    setPending(true);

    try {
      //apiへの登録リクエスト
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // 失敗した場合のエラーハンドリング
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message = data?.message ?? "登録に失敗しました";
        throw new Error(message);
      }

      const data = (await response.json().catch(() => null)) as unknown;
      if (data) {
        // APIレスポンスを整形して保存想定
        setUserFromApi(data);
      } else {
        // 最低限の情報でユーザーをセット
        setUser({
          uuid: null,
          display_name: form.display_name,
          avatar_url: null,
        });
      }
      // 登録成功後にホームページへリダイレクト
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "登録に失敗しました";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー登録</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange("password")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">表示名</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={handleChange("display_name")}
                  required
                />
              </div>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "登録中..." : "登録"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          ログイン画面は後で追加予定です。
        </p>
      </div>
    </div>
  );
}
