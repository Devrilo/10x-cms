/**
 * Media item (uploaded file)
 */
export interface MediaItem {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  description: string;
  uploadDate: string;
}

/**
 * Input for uploading media
 */
export interface UploadMediaInput {
  description?: string;
}

/**
 * Multer file type (from multer middleware)
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
