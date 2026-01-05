/**
 * Type definitions for 42 OAuth authentication
 */

/** Token response from 42 API */
export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
  secret_valid_until?: number;
}

/** Basic 42 user profile from /v2/me endpoint */
export interface User42 {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  usual_first_name: string | null;
  url: string;
  phone: string;
  displayname: string;
  kind: string;
  image: {
    link: string;
    versions: {
      large: string;
      medium: string;
      small: string;
      micro: string;
    };
  };
  staff?: boolean;
  correction_point: number;
  pool_month: string;
  pool_year: string;
  location: string | null;
  wallet: number;
  anonymize_date: string;
  data_erasure_date: string;
  created_at: string;
  updated_at: string;
  alumni?: boolean;
  active?: boolean;
}

/** Session data stored in cookies/JWT */
export interface SessionData {
  userId: number;
  login: string;
  displayName: string;
  email: string;
  imageUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** PKCE flow state stored temporarily during OAuth */
export interface PKCEState {
  codeVerifier: string;
  state: string;
  createdAt: number;
}
