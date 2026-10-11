import crypto from 'crypto';

export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateOTP = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculatePercentage = (obtained, total) => {
  if (total === 0) return 0;
  return ((obtained / total) * 100).toFixed(2);
};

export const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C+';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export const calculateGPA = (grade) => {
  const grades = {
    'A+': 4.0,
    A: 3.7,
    'B+': 3.3,
    B: 3.0,
    'C+': 2.3,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };
  return grades[grade] || 0;
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit),
    page: parseInt(page),
  };
};

export const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return { start, end, days };
};

export const truncateText = (text, length = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + suffix;
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{7,15}$/;
  return phoneRegex.test(phone);
};

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

export default {
  generateToken,
  generateOTP,
  formatDate,
  formatDateTime,
  calculatePercentage,
  calculateGrade,
  calculateGPA,
  slugify,
  getPagination,
  getDateRange,
  truncateText,
  getInitials,
  isValidEmail,
  isValidPhone,
  deepClone,
  sleep,
  retry,
};