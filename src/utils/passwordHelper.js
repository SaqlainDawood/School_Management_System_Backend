import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateRandomPassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const checkPasswordStrength = (password) => {
  const result = { score: 0, messages: [] };

  if (password.length < 6) {
    result.messages.push('Password must be at least 6 characters');
  } else {
    result.score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.messages.push('Password must contain both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    result.score += 1;
  } else {
    result.messages.push('Password must contain at least one number');
  }

  if (/[!@#$%^&*()]/.test(password)) {
    result.score += 1;
  } else {
    result.messages.push('Password must contain at least one special character');
  }

  return result;
};

export default {
  hashPassword,
  comparePassword,
  generateRandomPassword,
  generateResetToken,
  hashResetToken,
  checkPasswordStrength,
};