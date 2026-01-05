/**
 * 42 OAuth2 Authentication with PKCE
 *
 * Flow:
 * 1. Client calls /auth/login -> generates PKCE params, redirects to 42
 * 2. User authorizes on 42 -> redirected back to /auth/callback with code
 * 3. Server exchanges code for tokens using PKCE verifier
 * 4. Server creates session and redirects to app
 */

import { AUTH_CONFIG } from "./config";
import { generateCodeVerifier, generateCodeChallenge, generateState } from "./pkce";
import type { TokenResponse, User42, PKCEState } from "./types";

// In-memory store for PKCE state (in production, use Redis or similar)
// Key: state parameter, Value: PKCE state
const pkceStore = new Map<string, PKCEState>();

// Clean up expired PKCE states (older than 10 minutes)
const PKCE_EXPIRY_MS = 10 * 60 * 1000;

function cleanupExpiredStates() {
  const now = Date.now();
  for (const [key, value] of pkceStore.entries()) {
    if (now - value.createdAt > PKCE_EXPIRY_MS) {
      pkceStore.delete(key);
    }
  }
}

/**
 * Initiates the OAuth flow by generating PKCE parameters and
 * returning the 42 authorization URL
 */
export async function initiateOAuthFlow(): Promise<{ url: string; state: string }> {
  cleanupExpiredStates();

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store PKCE state for verification during callback
  pkceStore.set(state, {
    codeVerifier,
    state,
    createdAt: Date.now(),
  });

  // Build authorization URL with PKCE parameters
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: AUTH_CONFIG.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const url = `${AUTH_CONFIG.authorizeUrl}?${params.toString()}`;
  return { url, state };
}

/**
 * Handles the OAuth callback - exchanges the authorization code for tokens
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<{ tokens: TokenResponse; user: User42 }> {
  // Verify state and retrieve PKCE verifier
  const pkceState = pkceStore.get(state);
  if (!pkceState) {
    throw new Error("Invalid or expired state parameter");
  }

  // Remove used state
  pkceStore.delete(state);

  // Exchange authorization code for tokens
  const tokenResponse = await fetch(AUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: AUTH_CONFIG.clientId,
      client_secret: AUTH_CONFIG.clientSecret,
      code,
      redirect_uri: AUTH_CONFIG.redirectUri,
      code_verifier: pkceState.codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens: TokenResponse = await tokenResponse.json();

  // Fetch user profile
  const user = await fetchUserProfile(tokens.access_token);

  return { tokens, user };
}

/**
 * Refreshes an access token using the refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(AUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: AUTH_CONFIG.clientId,
      client_secret: AUTH_CONFIG.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetches the current user's profile from 42 API
 */
export async function fetchUserProfile(accessToken: string): Promise<User42> {
  const response = await fetch(AUTH_CONFIG.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user profile: ${error}`);
  }

  return response.json();
}
