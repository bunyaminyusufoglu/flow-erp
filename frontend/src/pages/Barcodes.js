import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function Barcodes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  // EAN-13 barkod üretimi (TR 869 prefix)
  function generateEAN13() {
    const prefix = '869';
    let base = prefix;
    for (let i = 0; i < 9; i++) base += Math.floor(Math.random() * 10).toString();
    const digits = base.split('').map(d => parseInt(d, 10));
    const sum = digits.reduce((acc, d, idx) => acc + d * (idx % 2 === 0 ? 1 : 3), 0);
    const check = (10 - (sum % 10)) % 10;
    return base + String(check);
  }

  // EAN-13 SVG render (library'sız)
  function EAN13({ value, barWidth = 2, barHeight = 60, fontSize = 12, margin = 8 }) {
    const normalized = normalizeEAN13(value);
    if (!normalized) {
      return <div className="text-muted small">Geçersiz barkod</div>;
    }
    const pattern = encodeEAN13(normalized);
    const width = pattern.length * barWidth + margin * 2;
    const height = barHeight + fontSize + margin * 3;
    let x = margin;
    const bars = [];
    for (let i = 0; i < pattern.length; i++) {
      const bit = pattern[i];
      if (bit === '1') {
        bars.push(
          <rect key={i} x={x} y={margin} width={barWidth} height={barHeight} fill="#000" />
        );
      }
      x += barWidth;
    }
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width={width} height={height} fill="#fff" />
        {bars}
        <text
          x={width / 2}
          y={barHeight + margin * 2}
          fontFamily="monospace"
          fontSize={fontSize}
          textAnchor="middle"
          fill="#000"
        >
          {normalized}
        </text>
      </svg>
    );
  }

  function normalizeEAN13(input) {
    if (!input) return '';
    const digits = String(input).replace(/\D/g, '');
    if (digits.length === 13) {
      return digits;
    }
    if (digits.length === 12) {
      const check = computeEAN13CheckDigit(digits);
      return digits + String(check);
    }
    // Try to pad with leading 0s if shorter (rare use)
    if (digits.length < 12) {
      const base = digits.padStart(12, '0');
      const check = computeEAN13CheckDigit(base);
      return base + String(check);
    }
    return '';
  }

  function computeEAN13CheckDigit(twelveDigits) {
    const arr = twelveDigits.split('').map(d => parseInt(d, 10));
    const sum = arr.reduce((acc, d, idx) => acc + d * (idx % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10;
  }

  // Encoding tables
  const L = {
    '0': '0001101','1': '0011001','2': '0010011','3': '0111101','4': '0100011',
    '5': '0110001','6': '0101111','7': '0111011','8': '0110111','9': '0001011'
  };
  const G = {
    '0': '0100111','1': '0110011','2': '0011011','3': '0100001','4': '0011101',
    '5': '0111001','6': '0000101','7': '0010001','8': '0001001','9': '0010111'
  };
  const R = {
    '0': '1110010','1': '1100110','2': '1101100','3': '1000010','4': '1011100',
    '5': '1001110','6': '1010000','7': '1000100','8': '1001000','9': '1110100'
  };
  const PARITY = {
    '0': 'LLLLLL',
    '1': 'LLGLGG',
    '2': 'LLGGLG',
    '3': 'LLGGGL',
    '4': 'LGLLGG',
    '5': 'LGGLLG',
    '6': 'LGGGLL',
    '7': 'LGLGLG',
    '8': 'LGLGGL',
    '9': 'LGGLGL'
  };

  function encodeEAN13(value) {
    const code = String(value);
    if (code.length !== 13) return '';
    const first = code[0];
    const left = code.slice(1, 7);
    const right = code.slice(7);
    const parity = PARITY[first] || 'LLLLLL';
    let pattern = '101'; // left guard
    // Left 6 digits
    for (let i = 0; i < 6; i++) {
      const d = left[i];
      const p = parity[i];
      pattern += (p === 'L' ? L[d] : G[d]);
    }
    // center guard
    pattern += '01010';
    // Right 6 digits (always R)
    for (let i = 0; i < 6; i++) {
      const d = right[i];
      pattern += R[d];
    }
    // right guard
    pattern += '101';
    return pattern;
  }

  // SVG string builder for printing
  function buildEAN13SvgString(value, barWidth = 2, barHeight = 60, fontSize = 12, margin = 8) {
    const normalized = normalizeEAN13(value);
    if (!normalized) return '<div>Geçersiz barkod</div>';
    const pattern = encodeEAN13(normalized);
    const width = pattern.length * barWidth + margin * 2;
    const height = barHeight + fontSize + margin * 3;
    let x = margin;
    let rects = '';
    for (let i = 0; i < pattern.length; i++) {
      const bit = pattern[i];
      if (bit === '1') {
        rects += `<rect x="${x}" y="${margin}" width="${barWidth}" height="${barHeight}" fill="#000" />`;
      }
      x += barWidth;
    }
    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#fff" />
  ${rects}
  <text x="${width / 2}" y="${barHeight + margin * 2}" font-family="monospace" font-size="${fontSize}" text-anchor="middle" fill="#000">${normalized}</text>
</svg>`;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: '1', limit: '1000', sortBy: 'createdAt', sortOrder: 'desc' });
        const res = await fetch(`${apiBase}/api/products?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Ürünler yüklenemedi');
        setProducts(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setError('Ürünler yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase]);

  const filtered = products.filter(p => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const hay = `${p.name} ${p.description} ${p.brand} ${p.sku || ''} ${p.barcode || ''}`.toLowerCase();
    return hay.includes(term);
  });

  function toggleSelect(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  async function printLabelForProduct(product) {
    try {
      setBusyId(product._id);
      setInfoMsg('');
      let code = product.barcode || product.sku || '';
      const nextProducts = [...products];
      // Eğer barkod yoksa oluştur ve kaydet (1 kez çakışmada tekrar dene)
      if (!code) {
        code = generateEAN13();
        for (let attempt = 0; attempt < 2; attempt++) {
          const bodyCreate = {
            name: product.name,
            description: product.description,
            sku: String(code).toUpperCase(),
            barcode: String(code),
            brand: product.brand,
            purchasePrice: Number(product.purchasePrice || 0),
            sellingPrice: Number(product.sellingPrice || 0),
            wholesalePrice: product.wholesalePrice === '' ? undefined : Number(product.wholesalePrice || 0),
            stockQuantity: Number(product.stockQuantity || 0),
            unit: product.unit,
            status: product.status,
            category: (product.category && (product.category._id || product.category)) || undefined
          };
          const resCreate = await fetch(`${apiBase}/api/products/${product._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyCreate)
          });
          const dataCreate = await resCreate.json();
          if (resCreate.ok && dataCreate?.success) {
            const idx = nextProducts.findIndex(p => p._id === product._id);
            if (idx >= 0) nextProducts[idx] = dataCreate.data;
            setProducts(nextProducts);
            break;
          } else {
            const message = dataCreate?.message || '';
            if (/kullanımda/i.test(message) && attempt === 0) {
              code = generateEAN13();
              continue;
            }
            // Kayıt başarısız ise bile yazdırmaya devam edeceğiz
            break;
          }
        }
      }
      // Print
      const svg = buildEAN13SvgString(code, 2, 70, 14, 8);
      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${product.name} - Barkod</title>
  <style>
    body { margin: 16px; font-family: -apple-system, Segoe UI, Roboto, Arial, Helvetica, sans-serif; }
    .label { width: 80mm; max-width: 100%; text-align: center; margin: 0 auto; }
    .name { font-weight: 600; margin-bottom: 8px; }
    .code { margin-top: 6px; font-family: monospace; font-size: 12pt; }
    @media print {
      body { margin: 0; }
      .label { page-break-after: always; margin-top: 10mm; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="name">${escapeHtml(product.name || '')}</div>
    <div class="svg">${svg}</div>
    <div class="code">${code}</div>
  </div>
  <script>
    window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 100); };
  </script>
</body>
</html>`;
      const win = window.open('', '_blank', 'width=480,height=640');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } else {
        setInfoMsg('Yazdırma penceresi açılamadı. Pop-up engelleyiciyi kontrol edin.');
      }
    } catch (e) {
      setInfoMsg('İşlem sırasında hata oluştu.');
    } finally {
      setBusyId('');
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function handleBulkPrint() {
    if (selectedIds.size === 0) return;
    try {
      setBulkBusy(true);
      setInfoMsg('');
      const nextProducts = [...products];
      const labels = [];
      for (const id of selectedIds) {
        const product = nextProducts.find(p => p._id === id);
        if (!product) continue;
        let code = product.barcode || product.sku || '';
        if (!code) {
          // generate and try to save once (with one retry on conflict)
          code = generateEAN13();
          for (let attempt = 0; attempt < 2; attempt++) {
            const body = {
              name: product.name,
              description: product.description,
              sku: String(code).toUpperCase(),
              barcode: String(code),
              brand: product.brand,
              purchasePrice: Number(product.purchasePrice || 0),
              sellingPrice: Number(product.sellingPrice || 0),
              wholesalePrice: product.wholesalePrice === '' ? undefined : Number(product.wholesalePrice || 0),
              stockQuantity: Number(product.stockQuantity || 0),
              unit: product.unit,
              status: product.status,
              category: (product.category && (product.category._id || product.category)) || undefined
            };
            const res = await fetch(`${apiBase}/api/products/${product._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok && data?.success) {
              const idx = nextProducts.findIndex(p => p._id === product._id);
              if (idx >= 0) nextProducts[idx] = data.data;
              code = data.data.barcode || data.data.sku || code;
              break;
            } else {
              const message = data?.message || '';
              if (/kullanımda/i.test(message) && attempt === 0) {
                code = generateEAN13();
                continue;
              }
              // give up save but still use generated code for print
              break;
            }
          }
        }
        const svg = buildEAN13SvgString(code, 2, 70, 14, 8);
        labels.push(`
          <div class="label">
            <div class="name">${escapeHtml(product.name || '')}</div>
            <div class="svg">${svg}</div>
            <div class="code">${code}</div>
          </div>
        `);
      }
      setProducts(nextProducts);
      if (labels.length === 0) return;
      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Toplu Etiket Yazdır</title>
  <style>
    body { margin: 12px; font-family: -apple-system, Segoe UI, Roboto, Arial, Helvetica, sans-serif; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80mm, 1fr));
      gap: 8mm;
      align-items: start;
    }
    .label { width: 80mm; max-width: 100%; text-align: center; margin: 0 auto; }
    .name { font-weight: 600; margin-bottom: 8px; font-size: 12pt; }
    .code { margin-top: 6px; font-family: monospace; font-size: 12pt; }
    @media print {
      body { margin: 0; }
      .grid { gap: 6mm; }
      .label { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
  </head>
  <body>
    <div class="grid">
      ${labels.join('\n')}
    </div>
    <script>
      window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 200); };
    </script>
  </body>
  </html>`;
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } else {
        setInfoMsg('Yazdırma penceresi açılamadı. Pop-up engelleyiciyi kontrol edin.');
      }
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <>
    <div className="container-fluid">
      <div className="row">
        <div className="col-auto p-0 d-none d-lg-block">
          <Sidebar />
        </div>
        <div className="col">
          <div className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary d-lg-none" onClick={() => { try { document.body.classList.add('sidebar-open'); } catch {} }}>☰</button>
                <h1 className="h4 mb-0">Barkod Oluştur</h1>
              </div>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Ara (ad, açıklama, marka, barkod)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ maxWidth: 320 }}
                />
                <button className="btn btn-erp" disabled={bulkBusy || selectedIds.size === 0} onClick={handleBulkPrint}>
                  {bulkBusy ? 'Hazırlanıyor...' : `Toplu Yazdır (${selectedIds.size})`}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {infoMsg && <div className="alert alert-info" role="alert">{infoMsg}</div>}

            {loading ? (
              <div className="card shadow-sm">
                <div className="card-body text-center text-muted">Yükleniyor...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center text-muted">Kayıt bulunamadı</div>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                {filtered.map(p => {
                  const code = p.barcode || p.sku || '';
                  const hasBarcode = !!code;
                  const isBusy = busyId === p._id;
                  return (
                    <div className="col" key={p._id}>
                      <div className="card h-100">
                        <div className="card-body d-flex flex-column align-items-center justify-content-between">
                          <div className="w-100 d-flex align-items-center justify-content-between">
                            <div className="form-check">
                              <input className="form-check-input" type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} />
                            </div>
                            <div className="fw-semibold text-truncate" title={p.name}>{p.name}</div>
                            <div style={{ width: 24 }} />
                          </div>
                          <div className="my-2 d-flex justify-content-center">
                            {hasBarcode ? (
                              <EAN13 value={code} barWidth={2} barHeight={60} fontSize={12} />
                            ) : (
                              <div className="text-muted small">Barkod yok</div>
                            )}
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-erp btn-sm"
                              disabled={isBusy}
                              onClick={() => printLabelForProduct(p)}
                              title="Etiketi yazdır"
                            >
                              {isBusy ? 'İşleniyor...' : 'Yazdır'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}


