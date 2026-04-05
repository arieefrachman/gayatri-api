const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./r2");
const crypto = require("crypto");
const path = require("path");

const BUCKET = process.env.R2_BUCKET_NAME;
const MEDIA_PREFIX = "/api/media/";

function mediaPath(key) {
  return `${MEDIA_PREFIX}${key}`;
}

/**
 * Upload a file buffer to R2.
 * @param {Buffer} buffer
 * @param {string} originalname
 * @param {string} mimetype
 * @param {string} folder - e.g. "teams", "sliders", "blog"
 * @returns {Promise<string>} /api/media/<key> path
 */
async function uploadToR2(buffer, originalname, mimetype, folder = "uploads") {
  const ext = path.extname(originalname).toLowerCase();
  const key = `${folder}/${crypto.randomBytes(12).toString("hex")}${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return mediaPath(key);
}

/**
 * Delete a file from R2.
 * Accepts /api/media/<key> paths or legacy full https:// URLs.
 */
async function deleteFromR2(url) {
  if (!url) return;
  let key;
  if (url.startsWith(MEDIA_PREFIX)) {
    key = url.slice(MEDIA_PREFIX.length);
  } else if (url.startsWith("https://") || url.startsWith("http://")) {
    try {
      const u = new URL(url);
      key = u.pathname.replace(/^\//, "");
    } catch {
      return;
    }
  } else {
    return;
  }
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // Ignore — object may already be gone
  }
}

module.exports = { uploadToR2, deleteFromR2 };
