import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children directly into document.body so that
 * position:fixed modals are never clipped by an ancestor
 * with overflow:auto or a CSS transform.
 */
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}