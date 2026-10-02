import { useState } from 'react';
import { ScanText, ImagePlus } from 'lucide-react';
import { receiptScanSupported, readReceiptText } from '../receipts/scan.js';
import { parseReceipt } from '../receipts/parse.js';
import { useToast } from './ui/Toast.jsx';
import Button from './ui/Button.jsx';

// Photo of a receipt -> a proposed expense. onParsed gets { name, amount, paidOn, category }
// (any of which may be missing) for the user to check and save. Native app only.
export default function ReceiptScanButton({ onParsed }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!receiptScanSupported) return null;

  const scan = async (fromGallery) => {
    setBusy(true);
    try {
      const text = await readReceiptText({ fromGallery });
      if (text === null) return;
      const { merchant, total, date, category } = parseReceipt(text);
      if (!merchant && !total) toast("Couldn't read that receipt. Try a flatter, brighter photo, or add the expense by hand.", { tone: 'error' });
      onParsed({ name: merchant ?? '', amount: total ?? '', paidOn: date ?? undefined, category });
    } catch (e) {
      toast(`Couldn't scan the receipt: ${e.message}`, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={() => scan(false)} disabled={busy}>
        <ScanText size={15} /> {busy ? 'Reading…' : 'Scan receipt'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => scan(true)} disabled={busy} aria-label="Choose a receipt photo">
        <ImagePlus size={15} />
      </Button>
    </div>
  );
}
