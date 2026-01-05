/**
 * 42 OAuth Configuration
 *
 * Environment variables are loaded from secret/.env
 * IMPORTANT: The redirect URI must EXACTLY match what's configured in the 42 app settings
 */

export const AUTH_CONFIG = {
  clientId: process.env.FT_UID ?? "",
  clientSecret: process.env.FT_SECRET ?? "",
  // IMPORTANT: Must match EXACTLY what's configured in 42 app settings
  // Update your 42 app at https://profile.intra.42.fr/oauth/applications
  redirectUri: process.env.REDIRECT_URI ?? "http://localhost:3000/callback",

  // 42 API OAuth endpoints
  authorizeUrl: "https://api.intra.42.fr/oauth/authorize",
  tokenUrl: "https://api.intra.42.fr/oauth/token",
  userInfoUrl: "https://api.intra.42.fr/v2/me",

  // Token settings
  tokenExpiresIn: 7200, // 2 hours in seconds
  refreshBeforeExpiry: 300, // Refresh 5 minutes before expiry

  // Scopes - 'public' is sufficient for basic user info
  scope: "public",
} as const;

export type AuthConfig = typeof AUTH_CONFIG;
