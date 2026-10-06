const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsBase = path.join(__dirname, '..', 'uploads');

// Ensure upload subdirectories exist
const subdirs = ['photos', 'videos', 'documents', 'receipts', 'posters', 'avatars', 'templates', 'generated'];
subdirs.forEach(dir => {
  const dirPath = path.join(uploadsBase, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Dangerous extensions to strictly reject
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin', '.js', '.mjs',
  '.php', '.py', '.pl', '.vbs', '.scr', '.msi', '.com', '.wsf'
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'documents';
    if (file.fieldname === 'photo') folder = 'photos';
    else if (file.fieldname === 'video') folder = 'videos';
    else if (file.fieldname === 'receipt') folder = 'receipts';
    else if (file.fieldname === 'poster') folder = 'posters';
    else if (file.fieldname === 'avatar') folder = 'avatars';
    else if (
      file.fieldname === 'template' ||
      file.fieldname === 'template_file' ||
      (req.originalUrl && req.originalUrl.includes('custom-templates'))
    ) folder = 'templates';
    else if (req.query.type && subdirs.includes(req.query.type)) folder = req.query.type;

    cb(null, path.join(uploadsBase, folder));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return cb(new Error('Dangerous file format rejected for security.'), false);
  }
  cb(null, true);
}

// 50MB file size limit for uploads
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = {
  upload,
  uploadsBase
};
