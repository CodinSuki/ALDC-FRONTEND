import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password with bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const hash = await bcryptjs.hash(password, SALT_ROUNDS);
  return hash;
};

/**
 * Verify plaintext password against bcrypt hash
 */
export const verifyPassword = async (
  plainPassword: string,
  passwordHash: string
): Promise<boolean> => {
  if (!plainPassword || !passwordHash) {
    return false;
  }
  try {
    const isMatch = await bcryptjs.compare(plainPassword, passwordHash);
    return isMatch;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Generate a random temporary password for password resets
 * Format: 12 random alphanumeric characters
 */
export const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
