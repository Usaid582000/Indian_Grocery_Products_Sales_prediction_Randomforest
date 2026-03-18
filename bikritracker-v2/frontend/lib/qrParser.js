/**
 * Parses a QR or barcode scan result into product fields.
 *
 * Handles three cases:
 *  1. Custom JSON QR  → {"name":"...","category":"...","price":50,"city":"..."}
 *  2. Product barcode → looks up Open Food Facts (free, no API key)
 *  3. Plain text      → treats the string as the product name
 */
export async function parseQRResult(rawText) {
  const text = rawText.trim();

  // ── 1. JSON QR ─────────────────────────────────────────────
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        source:      'qr-json',
        name:        String(parsed.name        || parsed.product_name || '').trim(),
        category:    String(parsed.category    || '').trim(),
        subcategory: String(parsed.subcategory || '').trim(),
        price:       parsed.price ? Number(parsed.price) : '',
        city:        String(parsed.city   || '').trim(),
        region:      String(parsed.region || '').trim(),
      };
    }
  } catch { /* not JSON */ }

  // ── 2. Barcode (EAN-8, EAN-13, UPC-A, UPC-E) ───────────────
  if (/^\d{8,14}$/.test(text)) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res  = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${text}.json`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p    = data.product;
        const cats = (p.categories_tags || [])
          .map((c) => c.replace(/^[a-z-]+:/, '').replace(/-/g, ' ').trim())
          .filter(Boolean)
          .map(titleCase);

        return {
          source:      'barcode',
          name:        (p.product_name || p.product_name_en || '').trim(),
          category:    cats[0] || '',
          subcategory: cats[1] || '',
          price:       '',
          city:        '',
          region:      '',
        };
      }

      // barcode scanned but product not in database
      return { source: 'barcode-not-found', name: '', _rawBarcode: text };
    } catch {
      return { source: 'barcode-error', name: '', _rawBarcode: text };
    }
  }

  // ── 3. Plain text → use as product name ────────────────────
  return { source: 'text', name: text };
}

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}