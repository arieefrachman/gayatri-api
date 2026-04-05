const multer = require("multer");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function imageFilter(_req, file, cb) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"));
  }
}

const memory = multer.memoryStorage();

const uploadImage = multer({
  storage: memory,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadImages = multer({
  storage: memory,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadImage, uploadImages };
