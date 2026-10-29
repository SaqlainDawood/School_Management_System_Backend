import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const subDirs = ['avatars', 'assignments', 'notes', 'fees', 'books', 'documents'];

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

subDirs.forEach((dir) => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = 'uploads';
//     const fieldMap = {
//       avatar: 'avatars',
//       assignment: 'assignments',
//       notes: 'notes',
//       feeVoucher: 'fees',
//       books: 'books',
//       documents: 'documents',
//     };

  //   const subFolder = fieldMap[file.fieldname] || 'documents';
  //   const dirPath = path.join(__dirname, '../../uploads', subFolder);

  //   if (!fs.existsSync(dirPath)) {
  //     fs.mkdirSync(dirPath, { recursive: true });
  //   }

  //   cb(null, dirPath);
  // },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
//     const ext = path.extname(file.originalname);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//   },
// });

const storage = multer.memoryStorage();

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    )
  );
};

const maxFileSize = Number.parseInt(
  process.env.MAX_FILE_SIZE,
  10
);

const upload = multer({
  storage,
  limits: {
    fileSize:
      Number.isFinite(maxFileSize) && maxFileSize > 0
        ? maxFileSize
        : 5 * 1024 * 1024,
  },
  fileFilter,
});

// Upload one file, for example: uploadSingle('avatar')
export const uploadSingle = (fieldName) =>
  upload.single(fieldName);

// Upload multiple files, for example: uploadMultiple('documents', 5)
export const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

// Upload files from multiple fields.
export const uploadFields = (fields) =>
  upload.fields(fields);

export default upload;