"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d0d",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            予期しないエラーが発生しました
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#a1a1a1",
              marginBottom: "1.5rem",
            }}
          >
            申し訳ありません。もう一度お試しください。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1.5rem",
              fontSize: "0.875rem",
              backgroundColor: "#fafafa",
              color: "#0d0d0d",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
