export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{7,15}$/;
  return phoneRegex.test(phone);
};

export const isValidPassword = (password) => {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidDate = (date) => {
  return !isNaN(new Date(date).getTime());
};

export const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[&<>"]/g, (match) => {
      const replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
      };
      return replacements[match] || match;
    });
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const validateRequiredFields = (data, requiredFields) => {
  const errors = [];
  for (const field of requiredFields) {
    if (isEmpty(data[field])) {
      errors.push(`${field} is required`);
    }
  }
  return errors;
};

export const validateObject = (data, rules) => {
  const errors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];

    for (const rule of fieldRules) {
      const [ruleName, ...params] = rule.split(':');

      switch (ruleName) {
        case 'required':
          if (isEmpty(value)) errors[field] = `${field} is required`;
          break;
        case 'email':
          if (!isEmpty(value) && !isValidEmail(value))
            errors[field] = `Please provide a valid email for ${field}`;
          break;
        case 'phone':
          if (!isEmpty(value) && !isValidPhone(value))
            errors[field] = `Please provide a valid phone number for ${field}`;
          break;
        case 'min':
          if (!isEmpty(value) && value.length < parseInt(params[0]))
            errors[field] = `${field} must be at least ${params[0]} characters`;
          break;
        case 'max':
          if (!isEmpty(value) && value.length > parseInt(params[0]))
            errors[field] = `${field} must be at most ${params[0]} characters`;
          break;
        case 'number':
          if (!isEmpty(value) && !isNumber(value))
            errors[field] = `${field} must be a number`;
          break;
        case 'in':
          if (!isEmpty(value) && !params.includes(value))
            errors[field] = `${field} must be one of: ${params.join(', ')}`;
          break;
        default:
          break;
      }
    }
  }

  return errors;
};

export default {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidURL,
  isValidDate,
  isValidObjectId,
  sanitizeInput,
  isEmpty,
  isNumber,
  isInteger,
  clamp,
  validateRequiredFields,
  validateObject,
};