import {
  format,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  subDays,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

export const formatDateTime = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

export const formatDateHuman = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMMM d, yyyy');
};

export const formatDateTimeHuman = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMMM d, yyyy h:mm a');
};

export const diffDays = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d2, d1);
};

export const diffHours = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInHours(d2, d1);
};

export const diffMinutes = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInMinutes(d2, d1);
};

export const addDaysToDate = (date, days) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addDays(d, days);
};

export const subDaysFromDate = (date, days) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return subDays(d, days);
};

export const isDateAfter = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isAfter(d1, d2);
};

export const isDateBefore = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isBefore(d1, d2);
};

export const isDateEqual = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isEqual(d1, d2);
};

export const getStartOfDay = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(d);
};

export const getEndOfDay = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(d);
};

export const getStartOfWeek = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(d);
};

export const getEndOfWeek = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfWeek(d);
};

export const getStartOfMonth = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfMonth(d);
};

export const getEndOfMonth = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfMonth(d);
};

export const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const isToday = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

export const isPast = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
};

export const isFuture = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date());
};

export const getCurrentDateISO = () => new Date().toISOString();

export const getCurrentDate = () => format(new Date(), 'yyyy-MM-dd');

export const getCurrentTime = () => format(new Date(), 'HH:mm:ss');

export default {
  formatDate,
  formatDateTime,
  formatDateHuman,
  formatDateTimeHuman,
  diffDays,
  diffHours,
  diffMinutes,
  addDaysToDate,
  subDaysFromDate,
  isDateAfter,
  isDateBefore,
  isDateEqual,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getAge,
  isToday,
  isPast,
  isFuture,
  getCurrentDateISO,
  getCurrentDate,
  getCurrentTime,
};
