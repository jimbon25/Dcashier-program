import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { catchAsync, AppError } from '../errorHandler';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Middleware autentikasi untuk semua route upload
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files are allowed!'));
    }
  }
});

// Upload image endpoint
router.post('/image', requireAdmin, upload.single('image'), catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'No image file provided');
  }

  const imageUrl = `/uploads/images/${req.file.filename}`;
  
  res.json({
    message: 'Image uploaded successfully',
    imageUrl: imageUrl
  });
}));

export default router;
