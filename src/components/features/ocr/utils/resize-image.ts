// Claude scales any image whose long edge exceeds 1568px down to it, so sending more pixels only adds upload time
const MAX_LONG_EDGE = 1568;
const JPEG_QUALITY = 0.85;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event);
    };
    img.src = url;
  });

/** Shrink a photo to the size Claude reads and encode it as a JPEG data URL */
export const resizeImageToDataUrl = async (file: File): Promise<string> => {
  const img = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_LONG_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
};
