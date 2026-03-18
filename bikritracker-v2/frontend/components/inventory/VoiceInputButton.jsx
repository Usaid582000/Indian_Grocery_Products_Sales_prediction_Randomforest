import { useState, useRef } from 'react';

/**
 * Mic button that activates Web Speech API for one field.
 * Click once to start, click again (or wait for result) to stop.
 *
 * Props:
 *   onResult   (string) => void   — called with the transcript
 *   fieldLabel string             — shown in title / aria-label
 *   lang       string             — BCP 47 language tag, default 'en-IN'
 */
export default function VoiceInputButton({
  onResult,
  fieldLabel = 'field',
  lang = 'en-IN',
}) {
  const [status, setStatus] = useState('idle'); // idle | listening | error | unsupported
  const recRef = useRef(null);

  function toggle() {
    const SR =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SR) {
      setStatus('unsupported');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    // stop if already listening
    if (status === 'listening') {
      recRef.current?.stop();
      setStatus('idle');
      return;
    }

    const r = new SR();
    recRef.current      = r;
    r.lang              = lang;
    r.continuous        = false;
    r.interimResults    = false;
    r.maxAlternatives   = 1;

    r.onstart  = () => setStatus('listening');

    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      setStatus('idle');
    };

    r.onerror  = () => {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    };

    r.onend = () => {
      // guard: don't override an error state that's already timed out
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    try {
      r.start();
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  const title =
    status === 'listening'   ? `Stop — listening for ${fieldLabel}` :
    status === 'error'       ? 'Microphone error' :
    status === 'unsupported' ? 'Voice input not supported in this browser' :
    `Voice input for ${fieldLabel}`;

  return (
    <button
      type="button"
      className={`voice-btn voice-btn-${status}`}
      onClick={toggle}
      title={title}
      aria-label={title}
    >
      {status === 'listening' ? (
        /* animated mic */
        <span className="voice-pulse">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"
              stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </span>
      ) : status === 'error' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : status === 'unsupported' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3"
            stroke="currentColor" strokeWidth="2"/>
          <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}