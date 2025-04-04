import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import db from '../../db/index';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../middleware/authenticate';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    const uploadFromBuffer = (buffer: Buffer): Promise<any> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    };
    const result: any = await uploadFromBuffer(req.file.buffer);
    const connection = await db;
    await connection.insert(schema.uploads).values({
      userId: req.user!.id,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      publicId: result.public_id,
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      fileUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed', error });
  }
});
router.get('/upload', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const connection = await db;
    const uploads = await connection
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.userId, req.user!.id));
    res.json({ uploads });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ message: 'Failed to fetch uploads', error });
  }
});

router.delete('/upload/:id', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  const uploadId = Number(req.params.id);

  if (isNaN(uploadId)) {
    return res.status(400).json({ message: 'Invalid upload ID' });
  }
  try {
    const connection = await db;
    const [upload] = await connection
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.id, uploadId));
    if (!upload || upload.userId !== req.user!.id) {
      return res.status(404).json({ message: 'Upload not found or unauthorized' });
    }
    await cloudinary.uploader.destroy(upload.publicId);
    await connection
      .delete(schema.uploads)
      .where(eq(schema.uploads.id, uploadId));

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete upload', error });
  }
});

export default router;
