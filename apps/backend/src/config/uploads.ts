import fs from 'fs';
import multer from 'multer';
import path from 'path';

const baseDir =
  typeof __dirname === 'undefined' ? path.resolve(process.cwd(), 'src', 'config') : __dirname;

export const uploadsDir = path.join(baseDir, '..', 'uploads');
const logosDir = path.join(uploadsDir, 'logos');
const productsDir = path.join(uploadsDir, 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten imágenes PNG, JPG o WEBP'));
  }

  cb(null, true);
};

export const uploadLogo = multer({
  dest: logosDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

export const uploadProductImage = multer({
  dest: productsDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});
