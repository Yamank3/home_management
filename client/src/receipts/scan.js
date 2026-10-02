import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { CapacitorPluginMlKitTextRecognition } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';

// Reading text off a photo uses Google ML Kit on the phone, so the receipt image never
// leaves the device. Not available in a browser.
export const receiptScanSupported = Capacitor.isNativePlatform();

function toBase64(url) {
  return fetch(url)
    .then((r) => r.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

// Takes a photo (or picks one from the gallery) and returns the text on it, or null if
// the user backed out.
export async function readReceiptText({ fromGallery = false } = {}) {
  let photo;
  try {
    photo = fromGallery
      ? (await Camera.chooseFromGallery({ allowMultipleSelection: false })).results[0]
      : await Camera.takePhoto({ quality: 80, correctOrientation: true });
  } catch (e) {
    if (/cancel/i.test(e?.message ?? '')) return null;
    throw e;
  }
  if (!photo?.webPath) return null;
  const { text } = await CapacitorPluginMlKitTextRecognition.detectText({ base64Image: await toBase64(photo.webPath) });
  return text;
}
