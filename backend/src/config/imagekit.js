// ─── ImageKit Configuration ───────────────────────────────────────────────────
// ImageKit stores and serves your document images via CDN
// Get keys from: https://imagekit.io → Dashboard → Developer Options

const ImageKit = require('imagekit');
const logger = require('../utils/logger');

let imagekitClient = null;

const getImageKit = () => {
  if (!imagekitClient) {
    imagekitClient = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekitClient;
};

// Check if ImageKit is properly configured
const isImageKitConfigured = () => {
  return !!(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT &&
    process.env.IMAGEKIT_PUBLIC_KEY !== 'your_imagekit_public_key'
  );
};

// Upload a file buffer to ImageKit
// Returns { fileId, url, thumbnailUrl } or falls back to a local placeholder
const uploadToImageKit = async (fileBuffer, fileName, folder = '/docurec') => {
  // If ImageKit is not configured, use a placeholder (so upload still works in dev)
  if (!isImageKitConfigured()) {
    logger.warn('ImageKit not configured — using placeholder URL for development');
    return {
      fileId: 'local_' + Date.now(),
      url: null,           // no real URL
      thumbnailUrl: null,
      name: fileName,
      size: fileBuffer.length,
    };
  }

  try {
    const ik = getImageKit();
    const result = await ik.upload({
      file: fileBuffer.toString('base64'),
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
      tags: ['docurec'],
    });

    return {
      fileId: result.fileId,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl || result.url,
      name: result.name,
      size: result.size,
    };
  } catch (error) {
    logger.error('ImageKit upload failed: ' + error.message);
    // Don't crash the upload — return placeholder so doc is still saved
    return {
      fileId: 'failed_' + Date.now(),
      url: null,
      thumbnailUrl: null,
      name: fileName,
      size: fileBuffer.length,
      uploadError: error.message,
    };
  }
};

// Delete a file from ImageKit
const deleteFromImageKit = async (fileId) => {
  if (!isImageKitConfigured() || fileId.startsWith('local_') || fileId.startsWith('failed_')) {
    return; // skip for dev placeholders
  }
  try {
    const ik = getImageKit();
    await ik.deleteFile(fileId);
  } catch (error) {
    logger.warn('Could not delete from ImageKit: ' + error.message);
  }
};

module.exports = { getImageKit, uploadToImageKit, deleteFromImageKit, isImageKitConfigured };
