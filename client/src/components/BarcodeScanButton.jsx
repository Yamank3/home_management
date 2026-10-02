import { useEffect, useRef, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { groceryApi } from '../api.js';
import { scanNative, scanWithCamera, webCameraSupported, isBarcode, ScannerNotReadyError } from '../barcode/scan.js';
import { useToast } from './ui/Toast.jsx';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';

// Browser version: live camera when supported, plus typing the number by hand.
function WebScanModal({ open, onClose, onCode }) {
  const videoRef = useRef(null);
  const [manual, setManual] = useState('');
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (!open || !webCameraSupported) return;
    let stream; let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const tick = async () => {
          if (stopped) return;
          const [hit] = await detector.detect(videoRef.current).catch(() => []);
          if (hit && isBarcode(hit.rawValue)) onCode(hit.rawValue); else requestAnimationFrame(tick);
        };
        tick();
      } catch { setCameraError('Camera not available. You can type the number instead.'); }
    })();
    return () => { stopped = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [open, onCode]);

  const submit = () => isBarcode(manual.trim()) && onCode(manual.trim());

  return (
    <Modal open={open} onClose={onClose} title="Scan a barcode"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!isBarcode(manual.trim())}>Look up</Button></>}>
      <div className="space-y-3">
        {webCameraSupported && !cameraError && <video ref={videoRef} muted playsInline className="w-full rounded-xl bg-black aspect-video object-cover" />}
        {cameraError && <p className="text-sm text-amber-600">{cameraError}</p>}
        <Input label="Or type the number under the barcode" inputMode="numeric" placeholder="e.g. 3017620422003"
          value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      </div>
    </Modal>
  );
}

// Scans a product barcode and hands back what Open Food Facts knows about it:
// { name, brand, quantity, category }.
export default function BarcodeScanButton({ onProduct }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [webOpen, setWebOpen] = useState(false);

  const lookup = async (code) => {
    setBusy(true);
    try {
      const product = await groceryApi.lookupBarcode(code);
      if (product) onProduct(product);
      else toast("We couldn't find that barcode. Type the name instead.", { tone: 'error' });
    } catch (e) {
      toast(e.offline ? "You're offline. Barcode lookup needs a connection." : e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!scanNative) return setWebOpen(true);
    try {
      const code = await scanWithCamera();
      if (code && isBarcode(code)) await lookup(code);
      else if (code) toast("That doesn't look like a product barcode.", { tone: 'error' });
    } catch (e) {
      toast(e instanceof ScannerNotReadyError ? e.message : `Couldn't open the scanner: ${e.message}`, { tone: 'error' });
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={start} disabled={busy}>
        <ScanLine size={15} /> {busy ? 'Looking up…' : 'Scan barcode'}
      </Button>
      <WebScanModal open={webOpen} onClose={() => setWebOpen(false)} onCode={(code) => { setWebOpen(false); lookup(code); }} />
    </>
  );
}
