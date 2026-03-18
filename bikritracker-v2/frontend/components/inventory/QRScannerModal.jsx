import { useEffect, useRef, useState } from 'react';
import ModalPortal from '../ui/ModalPortal';
import { parseQRResult } from '../../lib/qrParser';

export default function QRScannerModal({ onScan, onClose }) {
  const [phase,    setPhase]    = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [hint,     setHint]     = useState('');

  const scannerRef  = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Wait one tick so the Portal has flushed the div into the DOM
    const t = setTimeout(() => {
      if (mountedRef.current) start();
    }, 80);

    return () => {
      clearTimeout(t);
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cleanup() {
    const s = scannerRef.current;
    if (!s) return;
    scannerRef.current = null;
    try { if (s.isScanning) await s.stop(); } catch { /* ignore */ }
    try { s.clear(); } catch { /* ignore */ }
  }

  async function start() {
    // Guard: element must exist before we hand its ID to html5-qrcode
    const el = document.getElementById('qr-reader-box');
    if (!el) {
      if (mountedRef.current) {
        setPhase('error');
        setErrorMsg('Scanner element not found. Please close and try again.');
      }
      return;
    }

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (!mountedRef.current) return;

      const scanner = new Html5Qrcode('qr-reader-box', { verbose: false });
      scannerRef.current = scanner;

      const formats = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ];

      const scanConfig = {
        fps: 10,
        qrbox: { width: 280, height: 160 },
        formatsToSupport: formats,
        disableFlip: false,
      };

      const onSuccess = async (decodedText) => {
        if (!mountedRef.current) return;
        setPhase('processing');
        setHint('Looking up product…');

        await cleanup();
        if (!mountedRef.current) return;

        const result = await parseQRResult(decodedText);
        if (!mountedRef.current) return;

        if (result.source === 'barcode-not-found') {
          setPhase('error');
          setErrorMsg('Barcode not in database — fill details manually.');
          return;
        }
        if (result.source === 'barcode-error') {
          setPhase('error');
          setErrorMsg('Could not reach product database. Check your connection.');
          return;
        }

        onScan(result);
        onClose();
      };

      // noop — per-frame decode failures are normal
      const onFailure = () => {};

      // ── Camera fallback chain ──────────────────────────────
      // 1. Rear camera (mobile)  2. Front camera  3. First listed camera
      let started = false;

      // Try rear camera
      try {
        await scanner.start({ facingMode: 'environment' }, scanConfig, onSuccess, onFailure);
        started = true;
      } catch { /* no rear camera — try next */ }

      // Try front camera
      if (!started) {
        try {
          await scanner.start({ facingMode: 'user' }, scanConfig, onSuccess, onFailure);
          started = true;
        } catch { /* still no luck */ }
      }

      // Try first available camera by ID
      if (!started) {
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cameras.length > 0) {
          await scanner.start(cameras[0].id, scanConfig, onSuccess, onFailure);
          started = true;
        }
      }

      if (!started) throw new Error('No camera found on this device.');

      if (mountedRef.current) setPhase('scanning');

    } catch (err) {
      if (!mountedRef.current) return;

      const msg = err?.message || '';
      const denied =
        err?.name === 'NotAllowedError' ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('denied');
      const noCamera =
        msg.toLowerCase().includes('no camera') ||
        msg.toLowerCase().includes('not found') ||
        err?.name === 'NotFoundError';

      setPhase('error');
      setErrorMsg(
        denied  ? 'Camera permission denied. Allow camera access in your browser settings, then try again.' :
        noCamera ? 'No camera found on this device. Make sure a camera is connected and not in use by another app.' :
        `Camera error: ${msg || 'Unknown error'}. Make sure no other app is using the camera.`
      );
    }
  }

  function handleClose() {
    cleanup();
    onClose();
  }

  return (
    <ModalPortal>
      <div
        className="modal-backdrop qr-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="qr-modal card">

          {/* Header */}
          <div className="qr-modal-header">
            <div>
              <h3 style={{ margin: 0 }}>Scan Product</h3>
              <p className="text-sm text-muted" style={{ marginTop: 3 }}>
                Point camera at a barcode or QR code
              </p>
            </div>
            <button className="btn-icon" onClick={handleClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Camera viewport — always render the div so the ID exists */}
          <div className="qr-viewport">
            <div id="qr-reader-box" className="qr-reader-el" />

            {phase === 'starting' && (
              <div className="qr-overlay">
                <span className="spinner"
                  style={{ width: 28, height: 28, borderWidth: 3 }} />
                <p style={{ marginTop: 12, color: '#fff', fontSize: 14 }}>
                  Starting camera…
                </p>
              </div>
            )}

            {phase === 'processing' && (
              <div className="qr-overlay">
                <span className="spinner"
                  style={{ width: 28, height: 28, borderWidth: 3 }} />
                <p style={{ marginTop: 12, color: '#fff', fontSize: 14 }}>
                  {hint}
                </p>
              </div>
            )}

            {phase === 'error' && (
              <div className="qr-overlay qr-overlay-padded">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  style={{ marginBottom: 14 }}>
                  <circle cx="12" cy="12" r="10"
                    stroke="#ef4444" strokeWidth="1.8"/>
                  <path d="M12 8v4m0 4h.01"
                    stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <p style={{
                  color: '#fff', fontSize: 14, textAlign: 'center',
                  maxWidth: 280, lineHeight: 1.6, marginBottom: 18,
                }}>
                  {errorMsg}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={handleClose}>
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setPhase('starting');
                      setErrorMsg('');
                      setTimeout(() => {
                        if (mountedRef.current) start();
                      }, 100);
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          {phase === 'scanning' && (
            <div className="qr-tips">
              <div className="qr-tip">
                <span className="badge badge-orange"
                  style={{ fontSize: 10, flexShrink: 0 }}>
                  EAN / UPC
                </span>
                <span>
                  Scan the barcode on any packaged product to auto-fill details
                </span>
              </div>
              <div className="qr-tip">
                <span className="badge badge-gray"
                  style={{ fontSize: 10, flexShrink: 0 }}>
                  Custom QR
                </span>
                <span>
                  JSON format —{' '}
                  <code style={{
                    fontSize: 11, background: 'var(--bg)',
                    padding: '1px 5px', borderRadius: 4,
                  }}>
                    {`{"name":"Parle-G","category":"Snacks","price":10}`}
                  </code>
                </span>
              </div>
            </div>
          )}

          {/* No camera device hint */}
          {phase === 'error' && (
            <div className="qr-tips">
              <div className="qr-tip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  style={{ flexShrink: 0, color: 'var(--warning)' }}>
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <span>
                  On desktop, make sure your webcam is connected and not
                  being used by another app (Zoom, Teams, etc.)
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </ModalPortal>
  );
}