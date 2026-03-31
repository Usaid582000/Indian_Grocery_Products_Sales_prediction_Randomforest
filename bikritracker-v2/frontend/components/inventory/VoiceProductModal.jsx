import { useState, useRef } from 'react';
import ModalPortal from '../ui/ModalPortal';

/* ── Title case helper ──────────────────────────────────────── */
function toTitleCase(str) {
  return str.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Voice → product field parser ──────────────────────────── */
function parseVoiceToProduct(rawText) {
  const t = rawText
    .toLowerCase()
    .replace(/[,;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const result = {};

  const tryPatterns = (patterns) => {
    for (const pat of patterns) {
      const m = t.match(pat);
      if (m?.[1]?.trim()) return m[1].trim();
    }
    return null;
  };

  // ── Name ────────────────────────────────────────────────────
  const name = tryPatterns([
    /(?:product\s+)?name\s+(?:is\s+)?([a-z][a-z0-9\s'\-]+?)(?=\s+(?:category|sub|price|cost|city|region|area|and\b)|\s*$)/,
    /product\s+is\s+([a-z][a-z0-9\s'\-]+?)(?=\s+(?:category|sub|price|cost|city|region|area|and\b)|\s*$)/,
    /called\s+([a-z][a-z0-9\s'\-]+?)(?=\s+(?:category|sub|price|cost|city|region|area|and\b)|\s*$)/,
    /it['']?s\s+(?:called\s+)?([a-z][a-z0-9\s'\-]+?)(?=\s+(?:category|sub|price|cost|city|region|area|and\b)|\s*$)/,
    /add\s+(?:product\s+)?([a-z][a-z0-9\s'\-]+?)(?=\s+(?:category|sub|price|cost|city|region|area|and\b)|\s*$)/,
  ]);
  if (name) result.name = toTitleCase(name);

  // ── Category ─────────────────────────────────────────────────
  const category = tryPatterns([
    /(?:category|type|section|class)\s+(?:is\s+)?([a-z][a-z\s]+?)(?=\s+(?:sub|price|cost|city|region|area|and\b)|\s*$)/,
  ]);
  if (category) result.category = toTitleCase(category);

  // ── Subcategory ───────────────────────────────────────────────
  const subcategory = tryPatterns([
    /sub[\s\-]?(?:category|type|class|section)\s+(?:is\s+)?([a-z][a-z\s]+?)(?=\s+(?:price|cost|city|region|area|and\b)|\s*$)/,
  ]);
  if (subcategory) result.subcategory = toTitleCase(subcategory);

  // ── Price / Cost / Rate / MRP ─────────────────────────────────
  const price = tryPatterns([
    /(?:price|cost|rate|mrp|value)\s+(?:is\s+)?(?:rupees?\s+|rs\.?\s+)?(\d+(?:\.\d+)?)/,
    /costs?\s+(?:rupees?\s+|rs\.?\s+)?(\d+(?:\.\d+)?)/,
    /priced?\s+at\s+(?:rupees?\s+|rs\.?\s+)?(\d+(?:\.\d+)?)/,
    /worth\s+(?:rupees?\s+|rs\.?\s+)?(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?)/,
  ]);
  if (price) result.price = price;

  // ── City / Location / Place ───────────────────────────────────
  const city = tryPatterns([
    /(?:city|location|place|town)\s+(?:is\s+)?([a-z][a-z\s]+?)(?=\s+(?:region|area|zone|price|cost|category|sub|and\b)|\s*$)/,
    /based\s+in\s+([a-z][a-z\s]+?)(?=\s+(?:region|area|zone|price|cost|category|sub|and\b)|\s*$)/,
    /in\s+the\s+city\s+(?:of\s+)?([a-z][a-z\s]+?)(?=\s+(?:region|area|zone|price|cost|category|sub|and\b)|\s*$)/,
  ]);
  if (city) result.city = toTitleCase(city);

  // ── Region / Area / Zone / District ──────────────────────────
  const region = tryPatterns([
    /(?:region|area|zone|district)\s+(?:is\s+)?([a-z][a-z\s]+?)(?=\s+(?:price|cost|city|category|sub|and\b)|\s*$)/,
  ]);
  if (region) result.region = toTitleCase(region);

  return result;
}

/* ── Field definitions ──────────────────────────────────────── */
const FIELDS = [
  { key: 'name',        label: 'Product Name' },
  { key: 'category',    label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'price',       label: 'Price (₹)' },
  { key: 'city',        label: 'City' },
  { key: 'region',      label: 'Region' },
];

/* ── Main component ─────────────────────────────────────────── */
export default function VoiceProductModal({ onProceed, onClose }) {
  const [phase,      setPhase]      = useState('idle'); // idle | recording | paused | stopped
  const [transcript, setTranscript] = useState('');
  const [parsed,     setParsed]     = useState({});
  const [error,      setError]      = useState('');

  const recRef          = useRef(null);
  const isRecordingRef  = useRef(false);
  const transcriptRef   = useRef('');

  /* ── Start recording ─────────────────────────────────────── */
  function startRecording() {
    const SR =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const r = new SR();
    r.lang            = 'en-IN';
    r.continuous      = true;
    r.interimResults  = true;
    r.maxAlternatives = 1;

    // Preserve any text from a previous session (after resume)
    const baseText = transcriptRef.current.trim();

    // Per-session state — lives in closure, resets on each startRecording call
    let sessionText     = '';  // finalized text for this session
    let lastFinalSeen   = '';  // last final string we processed

    isRecordingRef.current = true;
    setError('');
    setPhase('recording');

    r.onresult = (e) => {
      // ── Find the latest final and current interim ─────────────
      let latestFinal = '';
      let interim     = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          latestFinal = e.results[i][0].transcript.trim();
        } else {
        }
      }

      // ── Handle final result ────────────────────────────────────
      if (latestFinal && latestFinal !== lastFinalSeen) {
        /*
         * Android Chrome sends CUMULATIVE finals:
         *   event 1 final → "name"
         *   event 2 final → "name is"        ← contains previous
         *   event 3 final → "name is Parle G" ← contains previous
         *
         * Desktop Chrome sends INCREMENTAL finals (one sentence at a time).
         *
         * Detection: if the new final starts with (or contains) the last final,
         * it's cumulative — use it directly as the session text.
         * Otherwise it's a new sentence — append it.
         */
        const isCumulative =
          sessionText === '' ||
          latestFinal.startsWith(lastFinalSeen) ||
          latestFinal.includes(lastFinalSeen);

        if (isCumulative) {
          sessionText = latestFinal;          // replace (it already includes everything)
        } else {
          sessionText = (sessionText + ' ' + latestFinal).trim(); // append new sentence
        }
        lastFinalSeen = latestFinal;
      }

      // ── Update transcript ─────────────────────────────────────
      const combined = [baseText, sessionText].filter(Boolean).join(' ');
      transcriptRef.current = combined ? combined + ' ' : '';
      setTranscript((combined + (interim ? ' ' + interim : '')).trim());
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech') return; // silence is fine
      setError(`Microphone error: ${e.error}. Please try again.`);
      isRecordingRef.current = false;
      setPhase('idle');
    };

    r.onend = () => {
      if (isRecordingRef.current) {
        // Browser stopped due to silence — show paused state (no restart = no sounds)
        setPhase('paused');
      } else {
        // User manually stopped
        const finalText = transcriptRef.current.trim();
        setTranscript(finalText);
        setParsed(parseVoiceToProduct(finalText));
        setPhase('stopped');
      }
    };

    recRef.current = r;
    try {
      r.start();
    } catch (err) {
      setError('Could not access microphone. Check permissions.');
      setPhase('idle');
      isRecordingRef.current = false;
    }
  }

  /* ── Stop recording ──────────────────────────────────────── */
  function stopRecording() {
    isRecordingRef.current = false;
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) { /* ignore */ }
      // Don't null here — onend will fire and finalize via the else branch
    }
  }

  // ── Stop & Review (from paused state) ───────────────────────
  // The recognizer already ended when paused, so onend won't fire again.
  // We finalize directly here.
  function stopAndReview() {
    isRecordingRef.current = false;
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) { /* ignore */ }
      recRef.current = null;
    }
    const finalText = transcriptRef.current.trim();
    setTranscript(finalText);
    setParsed(parseVoiceToProduct(finalText));
    setPhase('stopped');
  }

  // ── Resume from paused ───────────────────────────────────────
  function resumeRecording() {
    // Start a fresh recognition session (preserving transcriptRef text)
    startRecording();
  }

  // ── Reset ────────────────────────────────────────────────────
  function reset() {
    isRecordingRef.current = false;
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) { /* ignore */ }
      recRef.current = null;
    }
    transcriptRef.current = '';
    setPhase('idle');
    setTranscript('');
    setParsed({});
    setError('');
  }

  /* ── Handle edited transcript ────────────────────────────── */
  function handleTranscriptEdit(val) {
    setTranscript(val);
    setParsed(parseVoiceToProduct(val));
  }

  /* ── Dismiss ─────────────────────────────────────────────── */
  function handleClose() {
    isRecordingRef.current = false;
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) { /* ignore */ }
      recRef.current = null;
    }
    onClose();
  }

  const fieldCount = Object.values(parsed).filter(Boolean).length;

  return (
    <ModalPortal>
      <div
        className="modal-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="voice-modal card">

          {/* Header */}
          <div className="voice-modal-header">
            <div>
              <h3 style={{ margin: 0 }}>Voice Add Product</h3>
              <p className="text-sm text-muted" style={{ marginTop: 3 }}>
                Speak to fill in product details automatically
              </p>
            </div>
            <button className="btn-icon" onClick={handleClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Tip bar */}
          <div className="voice-modal-tip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.8"/>
              <path d="M12 8v4m0 4h.01" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>
              Say something like:{' '}
              <em>"Name is Parle G, category is Snacks, price is 10 rupees, city is Mumbai"</em>
            </span>
          </div>

          {/* Body */}
          <div className="voice-modal-body">

            {/* Mic area */}
            <div className="voice-mic-area">
              <div className={`voice-mic-icon ${
                phase === 'recording' ? 'recording' :
                phase === 'paused'    ? 'paused'    :
                phase === 'stopped'   ? 'done'      : ''
              }`}>
                {phase === 'stopped' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : phase === 'recording' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="9" y="2" width="6" height="12" rx="3"/>
                    <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"
                      stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3"
                      stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>

              {phase === 'idle' && (
                <p className="text-sm text-muted">Click Start Recording to begin</p>
              )}
              {phase === 'recording' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <p style={{ color: 'var(--error)', fontWeight: 700, fontSize: 14 }}>
                    Recording… speak now
                  </p>
                  <div className="voice-wave-dots">
                    <span /><span /><span /><span /><span />
                  </div>
                </div>
              )}
              {phase === 'stopped' && (
                <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
                  Recording complete
                </p>
              )}
              {phase === 'paused' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <p style={{ color: 'var(--warning)', fontWeight: 700, fontSize: 14 }}>
                    Paused — silence detected
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={resumeRecording}>
                    ▶ Tap to Continue
                  </button>
                </div>
              )}
            </div>

            {/* Transcript */}
            {(phase === 'recording' || phase === 'paused' || phase === 'stopped') && (
              <div className="voice-transcript-wrap">
                <label className="label">
                  Transcript
                  {phase === 'stopped' && (
                    <span className="text-xs text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
                      — edit to fix any errors
                    </span>
                  )}
                </label>
                <textarea
                  className="voice-transcript"
                  value={transcript}
                  onChange={(e) => phase === 'stopped' && handleTranscriptEdit(e.target.value)}
                  readOnly={phase !== 'stopped'}
                  placeholder="Your speech will appear here…"
                  rows={3}
                />
              </div>
            )}

            {/* Parsed fields */}
            {phase === 'stopped' && (
              <div className="voice-parsed-wrap">
                <p className="label" style={{ marginBottom: 10 }}>
                  Detected fields
                  <span style={{
                    marginLeft: 8, fontSize: 12, fontWeight: 600,
                    color: fieldCount > 0 ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {fieldCount} / {FIELDS.length} found
                  </span>
                </p>
                <div className="voice-parsed-grid">
                  {FIELDS.map(({ key, label }) => (
                    <div key={key} className={`voice-field ${parsed[key] ? 'detected' : 'missing'}`}>
                      <p className="voice-field-label">{label}</p>
                      <p className="voice-field-value">
                        {parsed[key] || <span className="text-light">Not detected</span>}
                      </p>
                    </div>
                  ))}
                </div>
                {fieldCount === 0 && (
                  <div className="alert alert-error" style={{ marginTop: 12 }}>
                    No fields detected. Try editing the transcript or re-recording with clearer speech.
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ marginTop: 8, margin: '8px 20px 0' }}>
                {error}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="voice-modal-footer">
            {phase === 'idle' && (
              <>
                <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                <button className="btn btn-primary" onClick={startRecording}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="9" y="2" width="6" height="12" rx="3"/>
                  </svg>
                  Start Recording
                </button>
              </>
            )}
            {phase === 'recording' && (
              <>
                <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                <button className="btn btn-danger" onClick={stopRecording}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="5" width="14" height="14" rx="2"/>
                  </svg>
                  Stop Recording
                </button>
              </>
            )}
            {phase === 'paused' && (
              <>
                <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                <button className="btn btn-secondary" onClick={reset}>Re-record</button>
                <button className="btn btn-danger" onClick={stopAndReview}>
                  Stop & Review
                </button>
              </>
            )}
            {phase === 'stopped' && (
              <>
                <button className="btn btn-secondary" onClick={reset}>Re-record</button>
                <button
                  className="btn btn-primary"
                  onClick={() => onProceed(parsed)}
                  disabled={fieldCount === 0}
                  title={fieldCount === 0 ? 'No fields were detected' : ''}
                >
                  Add Product →
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}