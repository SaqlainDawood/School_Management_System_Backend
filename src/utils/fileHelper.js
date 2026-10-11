import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');

export const ensureUploadDir = async () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'avatars'),
    path.join(uploadDir, 'assignments'),
    path.join(uploadDir, 'notes'),
    path.join(uploadDir, 'fees'),
    path.join(uploadDir, 'books'),
    path.join(uploadDir, 'documents'),
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

export const deleteFile = async (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(uploadDir, filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export const getFileInfo = async (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(uploadDir, filePath);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

export const getFileNameWithoutExtension = (filename) => {
  return path.basename(filename, path.extname(filename));
};

export const generateUniqueFilename = (originalName) => {
  const ext = getFileExtension(originalName);
  const name = getFileNameWithoutExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}-${timestamp}-${random}${ext}`;
};

export const fileExists = async (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(uploadDir, filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
};

export const getFileSize = async (filePath) => {
  const info = await getFileInfo(filePath);
  return info ? info.size : 0;
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const moveFile = async (source, destination) => {
  try {
    const sourcePath = path.isAbsolute(source) ? source : path.join(uploadDir, source);
    const destPath = path.isAbsolute(destination) ? destination : path.join(uploadDir, destination);
    await fs.rename(sourcePath, destPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
};

export const copyFile = async (source, destination) => {
  try {
    const sourcePath = path.isAbsolute(source) ? source : path.join(uploadDir, source);
    const destPath = path.isAbsolute(destination) ? destination : path.join(uploadDir, destination);
    await fs.copyFile(sourcePath, destPath);
    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    return false;
  }
};

export default {
  ensureUploadDir,
  deleteFile,
  getFileInfo,
  getFileExtension,
  getFileNameWithoutExtension,
  generateUniqueFilename,
  fileExists,
  getFileSize,
  formatFileSize,
  moveFile,
  copyFile,
};
