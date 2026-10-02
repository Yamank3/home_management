import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

export const scanNative = Capacitor.isNativePlatform();

// Product barcodes only (not QR codes), which also makes scanning faster.
const FORMATS = [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE];

export class ScannerNotReadyError extends Error {
  constructor() { super('Setting up the scanner. Try again in a moment.'); }
}

// Opens the phone's scanner screen and resolves with the barcode number, or null if
// the user backed out. Google's scanner module is downloaded once if it's missing.
export async function scanWithCamera() {
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    throw new ScannerNotReadyError();
  }
  try {
    const { barcodes } = await BarcodeScanner.scan({ formats: FORMATS });
    return barcodes[0]?.rawValue ?? null;
  } catch (e) {
    if (/cancel/i.test(e?.message ?? '')) return null;
    throw e;
  }
}

// In a browser, use the built-in BarcodeDetector where it exists (Chrome and Edge).
export const webCameraSupported =
  typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

// A product barcode is 8 to 14 digits.
export const isBarcode = (s) => /^\d{8,14}$/.test(s);
