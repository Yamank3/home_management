import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { voiceApi } from '../api.js';
import { useNavigate } from 'react-router-dom';

// Check browser support
const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const DISMISS_MS = 4000;

export default function VoiceCommand() {
  const navigate = useNavigate();
  const [state, setState]         = useState('idle');   // idle | listening | processing | success | error
  const [transcript, setTranscript] = useState('');
  const [message, setMessage]     = useState('');
  const recogRef  = useRef(null);
  const timerRef  = useRef(null);

  // Auto-dismiss result after DISMISS_MS
  useEffect(() => {
    if (state === 'success' || state === 'error') {
      timerRef.current = setTimeout(() => setState('idle'), DISMISS_MS);
    }
    return () => clearTimeout(timerRef.current);
  }, [state]);

  if (!SpeechRecognition) return null; // hide button if unsupported

  const startListening = () => {
    if (state !== 'idle') { stopListening(); return; }

    const recog = new SpeechRecognition();
    recog.lang = 'en-IN';             // prioritise Indian English + Hindi words
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    recog.onstart = () => setState('listening');

    recog.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setState('processing');

      try {
        const result = await voiceApi.command(text);
        setMessage(result.message || 'Done ✓');

        // Handle navigation intent
        if (result.intent === 'meal.suggest' && result.navigate) {
          navigate(result.navigate);
        }

        setState(result.intent === 'unknown' ? 'error' : 'success');
      } catch (err) {
        setMessage(err.message || 'Something went wrong');
        setState('error');
      }
    };

    recog.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setMessage('Microphone permission denied. Please allow microphone access.');
      } else if (e.error === 'no-speech') {
        setMessage("Didn't hear anything. Tap the mic and speak.");
      } else {
        setMessage(`Microphone error: ${e.error}`);
      }
      setState('error');
    };

    recog.onend = () => {
      if (state === 'listening') setState('idle');
    };

    recogRef.current = recog;
    recog.start();
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setState('idle');
    setTranscript('');
    setMessage('');
  };

  const dismiss = () => {
    clearTimeout(timerRef.current);
    stopListening();
  };

  // ── Colours per state ──
  const fabClass = {
    idle:       'bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl',
    listening:  'bg-red-500 hover:bg-red-600 shadow-lg animate-pulse',
    processing: 'bg-gray-500 cursor-wait shadow-lg',
    success:    'bg-green-500 shadow-lg',
    error:      'bg-amber-500 shadow-lg',
  }[state];

  const showToast = state === 'listening' || state === 'processing' || state === 'success' || state === 'error';

  return (
    <>
      {/* Toast card */}
      {showToast && (
        <div className="fixed bottom-28 right-4 md:bottom-20 md:right-20 z-50 max-w-xs w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {state === 'listening'  && <Mic size={16} className="text-red-500 animate-pulse" />}
              {state === 'processing' && <Loader2 size={16} className="text-gray-500 animate-spin" />}
              {state === 'success'    && <Check size={16} className="text-green-600" />}
              {state === 'error'      && <AlertCircle size={16} className="text-amber-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 mb-0.5">
                {state === 'listening'  && 'Listening…'}
                {state === 'processing' && 'Processing…'}
                {state === 'success'    && 'Done'}
                {state === 'error'      && 'Not understood'}
              </p>
              {transcript && (
                <p className="text-xs text-gray-400 italic truncate">"{transcript}"</p>
              )}
              {message && (
                <p className={`text-sm font-medium mt-1 ${
                  state === 'success' ? 'text-green-700' :
                  state === 'error'   ? 'text-amber-700' :
                  'text-gray-700'
                }`}>{message}</p>
              )}
              {state === 'error' && (
                <button
                  onClick={() => { dismiss(); setTimeout(startListening, 200); }}
                  className="mt-2 text-xs text-primary-600 font-medium hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
            <button onClick={dismiss} className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>

          {/* Hint phrases */}
          {state === 'listening' && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
              {[
                'add milk to groceries',
                'add paneer to inventory',
                'add dal tadka to meals',
                'mark vacuum as done',
              ].map(h => (
                <p key={h} className="text-xs text-gray-400 pl-5">"{h}"</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={startListening}
        title={state === 'idle' ? 'Voice command' : 'Stop'}
        className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 ${fabClass}`}
      >
        {state === 'listening'  ? <MicOff size={22} /> :
         state === 'processing' ? <Loader2 size={22} className="animate-spin" /> :
         state === 'success'    ? <Check size={22} /> :
         state === 'error'      ? <AlertCircle size={22} /> :
                                  <Mic size={22} />}
      </button>
    </>
  );
}
