"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/components/auth/user-context";

type RegisterPayload = {
  email: string;
  password: string;
  display_name: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type ForgotPayload = {
  email: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUserFromApi, setUser } = useUser();

  const [registerForm, setRegisterForm] = useState<RegisterPayload>({
    email: "",
    password: "",
    display_name: "",
  });
  const [loginForm, setLoginForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [forgotForm, setForgotForm] = useState<ForgotPayload>({
    email: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const handleRegisterChange =
    (key: keyof RegisterPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRegisterForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleLoginChange =
    (key: keyof LoginPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLoginForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleForgotChange =
    (key: keyof ForgotPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForgotForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerForm),
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
        });
      }

      router.push("/");
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
    setPending(true);

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginForm),
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

      router.push("/");
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

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>アカウント</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">ログイン</TabsTrigger>
                <TabsTrigger value="register">登録</TabsTrigger>
                <TabsTrigger value="forgot">再発行</TabsTrigger>
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">パスワード</Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={handleLoginChange("password")}
                      required
                    />
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">パスワード</Label>
                    <Input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      value={registerForm.password}
                      onChange={handleRegisterChange("password")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-display">表示名</Label>
                    <Input
                      id="register-display"
                      value={registerForm.display_name}
                      onChange={handleRegisterChange("display_name")}
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
