/**
 * Web Worker for Image Compression
 * Offloads heavy image processing to a background thread
 * to avoid blocking the main UI thread
 */

self.onmessage = async function(e) {
  const { imageData, options } = e.data;

  try {
    // Create an OffscreenCanvas for processing
    const img = await createImageBitmap(await fetch(imageData).then(r => r.blob()));

    const { maxWidth = 800, maxHeight = 600, quality = 0.7, format = 'jpeg' } = options;

    // Calculate new dimensions
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    // Create canvas and compress
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const blob = await canvas.convertToBlob({
      type: `image/${format}`,
      quality: quality
    });

    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onloadend = function() {
      self.postMessage({
        success: true,
        compressed: reader.result,
        originalSize: imageData.length,
        compressedSize: reader.result.length
      });
    };

    reader.onerror = function() {
      self.postMessage({
        success: false,
        error: 'Failed to convert to base64'
      });
    };

  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
};
