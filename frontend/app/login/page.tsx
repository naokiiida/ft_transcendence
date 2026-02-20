"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/components/auth/user-context";
import {
  registerRequestSchema,
  loginRequestSchema,
  type RegisterRequest,
  type LoginRequest,
} from "@/lib/schemas/auth";

type ForgotPayload = {
  email: string;
};

type FieldErrors = Record<string, string | null>;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen px-4 py-10">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              認証情報を読み込み中...
            </p>
          </div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromApi, setUser, isAuthenticated, isLoading } = useUser();
  const rawNext = searchParams.get("next") || "/user";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
    ? rawNext
    : "/user";

  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    email: "",
    password: "",
    display_name: "",
  });
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [forgotForm, setForgotForm] = useState<ForgotPayload>({
    email: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<FieldErrors>({});
  const [loginErrors, setLoginErrors] = useState<FieldErrors>({});

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  // すでにログイン済みならユーザーページへ
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isLoading, isAuthenticated, router, nextPath]);

  // OAuthコールバックのエラーを表示（早期リターンの前に配置してHooksルールを守る）
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_failed") {
      setError("42ログインに失敗しました。もう一度お試しください。");
    }
  }, [searchParams]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            認証を確認しています...
          </p>
        </div>
      </div>
    );
  }

  const handleRegisterChange =
    (key: keyof RegisterRequest) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRegisterForm((current) => ({ ...current, [key]: event.target.value }));
      // 入力中はフィールドエラーをクリア
      if (registerErrors[key]) {
        setRegisterErrors((prev) => ({ ...prev, [key]: null }));
      }
    };

  const handleLoginChange =
    (key: keyof LoginRequest) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLoginForm((current) => ({ ...current, [key]: event.target.value }));
      if (loginErrors[key]) {
        setLoginErrors((prev) => ({ ...prev, [key]: null }));
      }
    };

  const handleForgotChange =
    (key: keyof ForgotPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForgotForm((current) => ({ ...current, [key]: event.target.value }));
    };

  // onBlur: フィールド単位のバリデーション
  const validateRegisterField = (key: keyof RegisterRequest) => () => {
    const fieldSchema = registerRequestSchema.shape[key];
    const result = fieldSchema.safeParse(registerForm[key]);
    setRegisterErrors((prev) => ({
      ...prev,
      [key]: result.success ? null : (result.error.issues[0]?.message ?? null),
    }));
  };

  const validateLoginField = (key: keyof LoginRequest) => () => {
    const fieldSchema = loginRequestSchema.shape[key];
    const result = fieldSchema.safeParse(loginForm[key]);
    setLoginErrors((prev) => ({
      ...prev,
      [key]: result.success ? null : (result.error.issues[0]?.message ?? null),
    }));
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    // submit前にクライアント側バリデーション
    const validation = registerRequestSchema.safeParse(registerForm);
    if (!validation.success) {
      const flat = validation.error.flatten();
      const errors: FieldErrors = {};
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        errors[key] = messages?.[0] ?? null;
      }
      setRegisterErrors(errors);
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message = data?.message ?? "登録に失敗しました";
        throw new Error(message);
      }

      const data = (await response.json().catch(() => null)) as unknown;
      if (data) {
        setUserFromApi(data);
      } else {
        setUser({
          uuid: null,
          display_name: registerForm.display_name,
          avatar_url: null,
          wins: 0,
          losses: 0,
          user_score: 0,
        });
      }

      router.push(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "登録に失敗しました";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const validation = loginRequestSchema.safeParse(loginForm);
    if (!validation.success) {
      const flat = validation.error.flatten();
      const errors: FieldErrors = {};
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        errors[key] = messages?.[0] ?? null;
      }
      setLoginErrors(errors);
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message = data?.message ?? "ログインに失敗しました";
        throw new Error(message);
      }

      const data = (await response.json().catch(() => null)) as unknown;
      if (data) {
        setUserFromApi(data);
      }

      router.push(nextPath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ログインに失敗しました";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const handleForgot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch(`${apiBase}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forgotForm),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message = data?.message ?? "送信に失敗しました";
        throw new Error(message);
      }

      setNotice("メールを送信しました（開発用）");
    } catch (err) {
      const message = err instanceof Error ? err.message : "送信に失敗しました";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const handleOauth = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    window.location.href = `${apiBase}/api/auth/42`;
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>アカウント</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="login">ログイン</TabsTrigger>
                <TabsTrigger value="register">登録</TabsTrigger>
                <TabsTrigger value="forgot">再発行</TabsTrigger>
                <TabsTrigger value="42oauth">42login</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">メールアドレス</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginForm.email}
                      onChange={handleLoginChange("email")}
                      onBlur={validateLoginField("email")}
                    />
                    {loginErrors.email ? (
                      <p className="text-sm text-destructive">{loginErrors.email}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">パスワード</Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={handleLoginChange("password")}
                      onBlur={validateLoginField("password")}
                    />
                    {loginErrors.password ? (
                      <p className="text-sm text-destructive">{loginErrors.password}</p>
                    ) : null}
                  </div>
                  {error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "ログイン中..." : "ログイン"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-4">
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">メールアドレス</Label>
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange("email")}
                      onBlur={validateRegisterField("email")}
                    />
                    {registerErrors.email ? (
                      <p className="text-sm text-destructive">{registerErrors.email}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">パスワード</Label>
                    <Input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      value={registerForm.password}
                      onChange={handleRegisterChange("password")}
                      onBlur={validateRegisterField("password")}
                    />
                    {registerErrors.password ? (
                      <p className="text-sm text-destructive">{registerErrors.password}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-display">表示名</Label>
                    <Input
                      id="register-display"
                      value={registerForm.display_name}
                      onChange={handleRegisterChange("display_name")}
                      onBlur={validateRegisterField("display_name")}
                    />
                    {registerErrors.display_name ? (
                      <p className="text-sm text-destructive">{registerErrors.display_name}</p>
                    ) : null}
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
              </TabsContent>

              <TabsContent value="forgot" className="mt-4">
                <form className="space-y-4" onSubmit={handleForgot}>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">メールアドレス</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      value={forgotForm.email}
                      onChange={handleForgotChange("email")}
                      required
                    />
                  </div>
                  {error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}
                  {notice ? (
                    <Alert>
                      <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "送信中..." : "再発行リンクを送信(デコイ)"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="42oauth" className="mt-4">
                <form className="space-y-4" onSubmit={handleOauth}>
                  <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      42 Intraアカウントを使用してログインします。
                    </p>
                    <Button type="submit" className="w-full bg-[#00babc] hover:bg-[#00aeb0] text-white" disabled={pending}>
                      {pending ? "転送中..." : "42 Intraでログイン"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
