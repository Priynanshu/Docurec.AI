const ImageKit = require('imagekit');

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

const isImageKitConfigured = () => {
  return !!(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT &&
    process.env.IMAGEKIT_PUBLIC_KEY !== 'your_imagekit_public_key'
  );
};

const uploadToImageKit = async (fileBuffer, fileName, folder = '/docurec') => {
  if (!isImageKitConfigured()) {
    console.warn('ImageKit not configured — using placeholder URL for development');
    return {
      fileId: 'local_' + Date.now(),
      url: null,
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
    console.error(`ImageKit upload failed: ${error.message}`);
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

const deleteFromImageKit = async (fileId) => {
  if (!isImageKitConfigured() || fileId.startsWith('local_') || fileId.startsWith('failed_')) {
    return;
  }
  try {
    const ik = getImageKit();
    await ik.deleteFile(fileId);
  } catch (error) {
    console.warn(`Could not delete from ImageKit: ${error.message}`);
  }
};

module.exports = { getImageKit, uploadToImageKit, deleteFromImageKit, isImageKitConfigured };
