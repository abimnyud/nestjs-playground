import MulterGoogleCloudStorage, { storageEngine } from 'multer-cloud-storage';
import { join } from 'path';
import { Readable } from 'stream';
import 'dotenv/config';

export const multerConfig = (
  destination?: string,
): MulterGoogleCloudStorage => {
  const bucket = process.env.BUCKET_NAME;
  const projectId = process.env.BUCKET_NAME;
  const keyFilename = join(__dirname, process.env.SERVICE_KEY_PATH);

  return storageEngine({
    bucket,
    projectId,
    keyFilename,
    destination,
    filename: (req, file, cb) => {
      const fileName = file.originalname
        .replace(/\s/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\#/g, '')
        .replace(/[^a-zA-Z0-9.]/g, '');
      const finalFilename = `${Date.now()}_${fileName}`;

      cb(null, finalFilename);
    },
  });
};

/**
 * Type for multer uploaded file with additional information from cloud storage
 */
export class MulterCloudStorageFile implements Express.Multer.File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  stream: Readable;
  buffer: Buffer;
  bucket: string;
  destination: string;
  filename: string;
  path: string;
  contentType: string;
  size: number;
  uri: string;
  linkUrl: string;
  selfLink: string;
}
