/**
 * Image Compression Worker Interface
 * Provides a clean API to use the Web Worker for image compression
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

interface CompressionResult {
  success: boolean;
  compressed?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

let worker: Worker | null = null;

/**
 * Initialize the compression worker
 */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/imageCompressionWorker.js');
  }
  return worker;
}

/**
 * Compress an image using a Web Worker
 * This offloads the heavy computation to a background thread
 *
 * @param imageData - Base64 or Blob URL of the image
 * @param options - Compression options
 * @returns Promise with compressed image data
 */
export async function compressImageInWorker(
  imageData: string,
  options: CompressionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();

    // Set up message handler
    const messageHandler = (e: MessageEvent<CompressionResult>) => {
      worker.removeEventListener('message', messageHandler);

      if (e.data.success && e.data.compressed) {
        resolve(e.data.compressed);
      } else {
        reject(new Error(e.data.error || 'Compression failed'));
      }
    };

    worker.addEventListener('message', messageHandler);

    // Send compression task to worker
    worker.postMessage({
      imageData,
      options: {
        maxWidth: options.maxWidth || 800,
        maxHeight: options.maxHeight || 600,
        quality: options.quality || 0.7,
        format: options.format || 'jpeg'
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      reject(new Error('Compression timeout'));
    }, 30000);
  });
}

/**
 * Terminate the worker (cleanup)
 */
export function terminateCompressionWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

/**
 * Check if Web Workers are supported
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}
