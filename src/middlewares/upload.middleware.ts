import multer from 'multer';
import { Request } from 'express';

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// File filter for ZIP files
const zipFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed' ||
    file.originalname.endsWith('.zip')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed'));
  }
};

// Upload middleware for images (multiple files)
export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

// Upload middleware for ZIP files (single file)
export const uploadZip = multer({
  storage,
  fileFilter: zipFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

