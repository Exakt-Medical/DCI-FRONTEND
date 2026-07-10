/**
 * Utility to preprocess images for OCR using HTML Canvas.
 * Optimizes image size, converts to grayscale, adjusts contrast, sharpens text,
 * applies noise reduction, and applies thresholding to produce clean black-and-white text images.
 */

export const preprocessImageToCanvas = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // 1. Resize image (limit max dimension to 1200px to balance speed and accuracy)
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Get image data for pixel-level manipulation
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // 2. Grayscale & Contrast enhancement
          // Contrast factor: > 1 increases contrast. Let's use 1.5.
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Standard luminance weights for grayscale conversion
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Apply contrast adjustment
            gray = factor * (gray - 128) + 128;
            gray = Math.max(0, Math.min(255, gray));

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          ctx.putImageData(imgData, 0, 0);

          // 3. Sharpening filter using convolution matrix
          // [  0, -1,  0 ]
          // [ -1,  5, -1 ]
          // [  0, -1,  0 ]
          const sharpenedImgData = applySharpen(ctx, width, height);
          ctx.putImageData(sharpenedImgData, 0, 0);

          // 4. Thresholding / Binarization (Otsu's style or basic threshold)
          // Since it's grayscaled, let's apply an adaptive thresholding or simple local threshold.
          const thresholdedImgData = applyAdaptiveThreshold(ctx, width, height);
          ctx.putImageData(thresholdedImgData, 0, 0);

          resolve(canvas);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const preprocessImage = (file) => {
  return preprocessImageToCanvas(file).then(canvas => canvas.toDataURL("image/png"));
};

/**
 * Applies a 3x3 sharpening convolution filter.
 */
function applySharpen(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const weights = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * width + x) * 4;
      
      let r = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
          const scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
          const srcOff = (scy * width + scx) * 4;
          const wt = weights[cy * side + cx];
          r += src[srcOff] * wt;
        }
      }
      
      const val = Math.max(0, Math.min(255, r));
      dst[dstOff] = val;
      dst[dstOff + 1] = val;
      dst[dstOff + 2] = val;
      dst[dstOff + 3] = 255;
    }
  }
  return output;
}

/**
 * Applies a simple adaptive thresholding using a local mean difference.
 */
function applyAdaptiveThreshold(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;
  
  // Radius of local area (e.g. 8px) and constant offset (C = 10)
  const radius = 8;
  const C = 10;
  
  // We can calculate local means efficiently. For simplicity, we sample a local grid.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate local mean
      let sum = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy += 2) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        
        for (let dx = -radius; dx <= radius; dx += 2) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          
          sum += src[(ny * width + nx) * 4];
          count++;
        }
      }
      
      const localMean = sum / count;
      const val = src[idx] < (localMean - C) ? 0 : 255;
      
      dst[idx] = val;
      dst[idx + 1] = val;
      dst[idx + 2] = val;
      dst[idx + 3] = 255;
    }
  }
  return output;
}
