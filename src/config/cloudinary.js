
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a Multer file directly to Cloudinary.
 *
 * Requires a file object from multer.memoryStorage(),
 * which contains file.buffer.
 */
export const uploadToCloudinary = async (
  file,
  folder = 'school-management'
) => {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new Error(
      'Invalid file: expected a Multer file with a buffer. ' +
      'Make sure multer.memoryStorage() is being used.'
    );
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      'Cloudinary configuration is missing. Check your environment variables.'
    );
  }

  const isImage = file.mimetype?.startsWith('image/');
  const extension = path.extname(file.originalname || '');
  const uniqueId = randomUUID();

  const options = {
    folder,
    resource_type: 'auto',
    public_id: isImage
      ? uniqueId
      : `${uniqueId}${extension}`,
    ...(isImage
      ? {
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      : {}),
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error(
            'Cloudinary upload error:',
            error.message
          );
          return reject(error);
        }

        if (!result?.secure_url || !result?.public_id) {
          return reject(
            new Error(
              'Cloudinary upload completed without a valid file URL or public ID.'
            )
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      }
    );

    stream.on('error', (error) => {
      reject(error);
    });

    stream.end(file.buffer);
  });
};

/**
 * Delete a file previously uploaded to Cloudinary.
 *
 * Pass the resourceType returned by uploadToCloudinary()
 * when deleting non-image files.
 */
export const deleteFromCloudinary = async (
  publicId,
  resourceType = 'image'
) => {
  if (!publicId) {
    throw new Error('Cloudinary public ID is required.');
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });

  return result;
};

export default cloudinary;
