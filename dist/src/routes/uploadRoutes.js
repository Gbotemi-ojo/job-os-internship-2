"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const index_1 = __importDefault(require("../../db/index"));
const schema = __importStar(require("../../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const authenticate_1 = require("../middleware/authenticate");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
router.post('/', authenticate_1.authenticate, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                });
                stream.end(buffer);
            });
        };
        const result = await uploadFromBuffer(req.file.buffer);
        const connection = await index_1.default;
        await connection.insert(schema.uploads).values({
            userId: req.user.id,
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
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'File upload failed', error });
    }
});
router.get('/', authenticate_1.authenticate, async (req, res) => {
    try {
        const connection = await index_1.default;
        const uploads = await connection
            .select()
            .from(schema.uploads)
            .where((0, drizzle_orm_1.eq)(schema.uploads.userId, req.user.id));
        res.json({ uploads });
    }
    catch (error) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ message: 'Failed to fetch uploads', error });
    }
});
router.delete('/:id', authenticate_1.authenticate, async (req, res) => {
    const uploadId = Number(req.params.id);
    if (isNaN(uploadId)) {
        return res.status(400).json({ message: 'Invalid upload ID' });
    }
    try {
        const connection = await index_1.default;
        const [upload] = await connection
            .select()
            .from(schema.uploads)
            .where((0, drizzle_orm_1.eq)(schema.uploads.id, uploadId));
        if (!upload || upload.userId !== req.user.id) {
            return res.status(404).json({ message: 'Upload not found or unauthorized' });
        }
        await cloudinary_1.v2.uploader.destroy(upload.publicId);
        await connection
            .delete(schema.uploads)
            .where((0, drizzle_orm_1.eq)(schema.uploads.id, uploadId));
        res.json({ message: 'Upload deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete upload', error });
    }
});
exports.default = router;
