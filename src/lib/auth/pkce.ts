/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0 authentication
 *
 * PKCE adds an extra layer of security to the OAuth flow by requiring:
 * 1. code_verifier: A random string generated before the auth request
 * 2. code_challenge: SHA256 hash of the verifier, sent with the auth request
 *
 * The verifier is stored and sent during token exchange, proving the same
 * client that initiated the flow is completing it.
 */

/**
 * Generates a cryptographically random code verifier for PKCE
 * @returns A base64url-encoded random string (43-128 characters)
 */
export function generateCodeVerifier(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(randomBytes);
}

/**
 * Generates a code challenge from the verifier using SHA256
 * @param verifier The code verifier to hash
 * @returns A base64url-encoded SHA256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generates a random state parameter to prevent CSRF attacks
 * @returns A base64url-encoded random string
 */
export function generateState(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return base64UrlEncode(randomBytes);
}

/**
 * Base64url encoding (RFC 4648) - URL-safe base64 without padding
 * Standard base64 uses +, /, and = which need URL encoding
 * Base64url replaces + with -, / with _, and removes =
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
