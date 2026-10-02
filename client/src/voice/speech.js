import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeech } from '@capacitor-community/speech-recognition';

// One speech source for both worlds: the phone's recogniser inside the Android app
// (Android's web view has none), the browser's own everywhere else. Prefers Indian
// English, which also copes with the Hindi words the voice commands understand.
const LANGUAGE = 'en-IN';
const native = Capacitor.isNativePlatform();
const WebSpeech = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export class SpeechError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const MESSAGES = {
  'not-allowed': 'Microphone permission denied. Please allow microphone access.',
  'no-speech': "Didn't hear anything. Tap the mic and speak.",
  network: 'Speech recognition needs an internet connection.',
};
const describe = (code) => MESSAGES[code] ?? `Microphone error: ${code}`;

export async function speechSupported() {
  if (!native) return !!WebSpeech;
  try { return (await NativeSpeech.available()).available; } catch { return false; }
}

async function listenNative() {
  let permission = await NativeSpeech.checkPermissions();
  if (permission.speechRecognition !== 'granted') permission = await NativeSpeech.requestPermissions();
  if (permission.speechRecognition !== 'granted') throw new SpeechError('not-allowed', describe('not-allowed'));
  try {
    const { matches } = await NativeSpeech.start({ language: LANGUAGE, maxResults: 1, partialResults: false, popup: false });
    const text = matches?.[0]?.trim();
    if (!text) throw new SpeechError('no-speech', describe('no-speech'));
    return text;
  } catch (e) {
    if (e instanceof SpeechError) throw e;
    throw new SpeechError('error', describe(e?.message || 'error'));
  }
}

let webRecogniser = null;
function listenWeb() {
  return new Promise((resolve, reject) => {
    const recog = new WebSpeech();
    recog.lang = LANGUAGE;
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;
    let heard = false;
    recog.onresult = (e) => { heard = true; resolve(e.results[0][0].transcript); };
    recog.onerror = (e) => reject(new SpeechError(e.error, describe(e.error)));
    recog.onend = () => { if (!heard) reject(new SpeechError('aborted', 'Stopped listening')); };
    webRecogniser = recog;
    recog.start();
  });
}

// Listens for one utterance and resolves with the recognised text.
export const listenOnce = () => (native ? listenNative() : listenWeb());

export function stopListening() {
  if (native) NativeSpeech.stop().catch(() => {});
  else webRecogniser?.stop();
}
