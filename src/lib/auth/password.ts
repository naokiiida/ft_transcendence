/**
 * Password hashing utilities using Bun's built-in bcrypt implementation
 *
 * Security Notes:
 * - Uses bcrypt with configurable cost factor (default: 10)
 * - Salt is automatically generated and embedded in hash
 * - Hash format: $2b$[cost]$[22-char salt][31-char hash]
 */

/** bcrypt cost factor - higher = slower but more secure */
const BCRYPT_COST = 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise<string> - bcrypt hash including embedded salt
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: BCRYPT_COST,
  });
}

/**
 * Verify a password against a bcrypt hash
 * Uses constant-time comparison to prevent timing attacks
 * @param password - Plain text password to verify
 * @param hash - bcrypt hash to compare against
 * @returns Promise<boolean> - true if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/**
 * Password validation rules
 * Returns null if valid, or error message if invalid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.length > 128) {
    return "Password must not exceed 128 characters";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

/**
 * Validate email format
 * Uses a practical regex that covers most valid emails
 */
export function validateEmail(email: string): string | null {
  if (!email || email.length === 0) {
    return "Email is required";
  }
  if (email.length > 254) {
    return "Email must not exceed 254 characters";
  }
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }
  return null;
}

/**
 * Validate username (login)
 */
export function validateUsername(username: string): string | null {
  if (!username || username.length === 0) {
    return "Username is required";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters long";
  }
  if (username.length > 20) {
    return "Username must not exceed 20 characters";
  }
  // Only alphanumeric, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return "Username can only contain letters, numbers, underscores, and hyphens";
  }
  return null;
}
