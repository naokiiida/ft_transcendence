// 自前パーサー "a=1; ft_session=xxx; b=2"のような文字列から特定のクッキー名の値を取得
// cookie-parserのほうがよい。
export function readCookie(
  cookieHeader: string,
  name: string,
): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}
