
import multer from 'multer';

// Store uploaded files temporarily in memory.
// Cloudinary will store the files permanently.
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
    new Error(`Invalid file type: ${file.mimetype}`)
  );
};

const configuredLimit = Number.parseInt(
  process.env.MAX_FILE_SIZE || '',
  10
);

const upload = multer({
  storage,
  limits: {
    fileSize:
      Number.isFinite(configuredLimit) &&
      configuredLimit > 0
        ? configuredLimit
        : 5 * 1024 * 1024,
  },
  fileFilter,
});

export const uploadSingle = (fieldName) =>
  upload.single(fieldName);

export const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

export const uploadFields = (fields) =>
  upload.fields(fields);

export default upload;
