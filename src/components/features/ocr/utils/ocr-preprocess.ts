/** Minimum width to upscale small images for better OCR accuracy */
const MIN_WIDTH = 1500;

/** Load an image source (File or URL) into an HTMLImageElement */
const loadImage = (source: File | string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });

/** Apply grayscale, contrast enhancement, and binarization to improve OCR accuracy */
export const preprocessImage = async (
  source: File | string,
): Promise<string> => {
  const img = await loadImage(source);

  // Upscale small images for better character recognition
  const scale = img.width < MIN_WIDTH ? MIN_WIDTH / img.width : 1;
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Use high-quality image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Revoke object URL if created from File
  if (source instanceof File) {
    URL.revokeObjectURL(img.src);
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Pass 1: Convert to grayscale and collect histogram for adaptive threshold
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114,
    );
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    histogram[gray]++;
  }

  // Otsu's method for optimal binarization threshold
  const totalPixels = width * height;
  let sumTotal = 0;
  for (let i = 0; i < 256; i++) {
    sumTotal += i * histogram[i];
  }

  let sumBg = 0;
  let weightBg = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let i = 0; i < 256; i++) {
    weightBg += histogram[i];
    if (weightBg === 0) continue;
    const weightFg = totalPixels - weightBg;
    if (weightFg === 0) break;

    sumBg += i * histogram[i];
    const meanBg = sumBg / weightBg;
    const meanFg = (sumTotal - sumBg) / weightFg;
    const variance = weightBg * weightFg * (meanBg - meanFg) ** 2;

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  // Pass 2: Apply contrast stretch and binarization
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
};
