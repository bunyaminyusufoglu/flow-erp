import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';

export default function Products() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 10;
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    stockQuantity: '',
    unit: 'adet',
    status: 'active'
  });
  const [skuTouched, setSkuTouched] = useState(false);

  // View/Edit state
  const [showView, setShowView] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    stockQuantity: '',
    unit: 'adet',
    status: 'active'
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  function generateSku(name, price) {
    const letter = (name || '').trim().charAt(0);
    const priceStr = String(price ?? '').trim();
    if (!letter || !priceStr) return '';
    // Keep numeric form with dot decimal, strip spaces
    const normalized = priceStr.replace(',', '.');
    const n = Number(normalized);
    if (!isFinite(n) || n <= 0) return '';
    const formatted = Number.isInteger(n) ? String(Math.trunc(n)) : n.toFixed(2).replace(/\.?0+$/, '');
    return `${letter.toUpperCase()}-${formatted}`;
  }

  // EAN-13 barkod üretimi (Türkiye ön eki 869 ile)
  function generateEAN13() {
    const prefix = '869'; // TR
    // 9 rastgele rakam üret -> toplam 12 rakam (kontrol hanesi hariç)
    let base = prefix;
    for (let i = 0; i < 9; i++) {
      base += Math.floor(Math.random() * 10).toString();
    }
    // Checksum hesapla
    const digits = base.split('').map(d => parseInt(d, 10));
    const sum = digits.reduce((acc, d, idx) => {
      // Sağdan değil soldan indekslendiği için: tek indeksler 3 ile çarpılır (EAN kuralı: 12 hane için sağdan sayınca tekler 3'tür)
      // Soldan 0-based için: (idx % 2 === 0) -> 1x, (idx % 2 === 1) -> 3x, çünkü 12 haneli dizide bu dağılım geçerlidir (prefix sabit).
      return acc + d * (idx % 2 === 0 ? 1 : 3);
    }, 0);
    const check = (10 - (sum % 10)) % 10;
    return base + String(check);
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
        if (search) params.set('search', search);
        const res = await fetch(`${apiBase}/api/products?${params.toString()}`);
        const data = await res.json();
        if (!isMounted) return;
        if (!data?.success) throw new Error(data?.message || 'Hata');
        setProducts(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (e) {
        if (!isMounted) return;
        setError('Ürünler yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProducts();
    return () => { isMounted = false; };
  }, [apiBase, page, search, sortBy, sortOrder]);

  // Ürün kategorisi kullanılmıyor

  // Body scroll ve modal-open sınıfı yönetimi
  useEffect(() => {
    if (showCreate || showView || showEdit || showDelete) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showCreate, showView, showEdit, showDelete]);

  // Yeni ürün modal açıldığında otomatik barkod üret
  useEffect(() => {
    if (showCreate) {
      const code = generateEAN13();
      setForm(prev => ({ ...prev, barcode: code, sku: code }));
      setSkuTouched(true);
    }
  }, [showCreate]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError('');

      // Maksimum 1 kere çakışma durumunda yeniden barkod üretip dene
      let localForm = { ...form };
      for (let attempt = 0; attempt < 2; attempt++) {
        const body = {
          name: localForm.name,
          sku: String(localForm.barcode || localForm.sku || '').toUpperCase(),
          barcode: String(localForm.barcode || localForm.sku || ''),
          // brand removed
          // purchasePrice removed
          sellingPrice: Number(localForm.sellingPrice || 0),
          wholesalePrice: localForm.wholesalePrice === '' ? undefined : Number(localForm.wholesalePrice),
          stockQuantity: Number(localForm.stockQuantity || 0),
          unit: localForm.unit,
          status: localForm.status
        };
        const res = await fetch(`${apiBase}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok && data?.success) {
          // Başarılı: listeyi yenile
          setShowCreate(false);
          setForm({ name: '', sku: '', barcode: '', purchasePrice: '', sellingPrice: '', wholesalePrice: '', stockQuantity: '', unit: 'adet', status: 'active' });
          setPage(1);
          // trigger fetch (effect deps)
          setSearch(s => s);
          return;
        } else {
          const message = data?.message || 'Kaydetme hatası';
          // Duplicate ise otomatik yeni barkod üret ve tekrar dene
          if (/kullanımda/i.test(message) && attempt === 0) {
            const code = generateEAN13();
            localForm.barcode = code;
            localForm.sku = code;
            setForm(prev => ({ ...prev, barcode: code, sku: code }));
            continue;
          }
          throw new Error(message);
        }
      }
    } catch (err) {
      setCreateError(err.message || 'Ürün eklenemedi');
    } finally {
      setCreating(false);
    }
  }

  function openView(product) {
    setViewProduct(product);
    setShowView(true);
  }

  function openEdit(product) {
    setEditProduct(product);
    setEditForm({
      name: product.name || '',
      sku: product.sku || product.barcode || '',
      barcode: product.barcode || product.sku || '',
      purchasePrice: product.purchasePrice ?? '',
      sellingPrice: product.sellingPrice ?? '',
      wholesalePrice: product.wholesalePrice ?? '',
      stockQuantity: product.stockQuantity ?? '',
      unit: product.unit || 'adet',
      status: product.status || 'active'
    });
    setUpdateError('');
    setShowEdit(true);
  }

  function openDelete(product) {
    setDeleteProduct(product);
    setShowDelete(true);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editProduct) return;
    try {
      setUpdating(true);
      setUpdateError('');

      let localForm = { ...editForm };
      for (let attempt = 0; attempt < 2; attempt++) {
        const body = {
          name: localForm.name,
          sku: String(localForm.barcode || localForm.sku || '').toUpperCase(),
          barcode: String(localForm.barcode || localForm.sku || ''),
          // brand removed
          // purchasePrice removed
          sellingPrice: Number(localForm.sellingPrice || 0),
          wholesalePrice: localForm.wholesalePrice === '' ? undefined : Number(localForm.wholesalePrice),
          stockQuantity: Number(localForm.stockQuantity || 0),
          unit: localForm.unit,
          status: localForm.status
        };
        const res = await fetch(`${apiBase}/api/products/${editProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok && data?.success) {
          // Update list in place
          setProducts(prev => prev.map(p => p._id === data.data._id ? data.data : p));
          setShowEdit(false);
          return;
        } else {
          const message = data?.message || 'Güncelleme hatası';
          if (/kullanımda/i.test(message) && attempt === 0) {
            const code = generateEAN13();
            localForm.barcode = code;
            localForm.sku = code;
            setEditForm(prev => ({ ...prev, barcode: code, sku: code }));
            continue;
          }
          throw new Error(message);
        }
      }
    } catch (err) {
      setUpdateError(err.message || 'Ürün güncellenemedi');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    try {
      setDeleting(true);
      const res = await fetch(`${apiBase}/api/products/${deleteProduct._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Silme hatası');
      }
      setShowDelete(false);
      setProducts(prev => prev.filter(p => p._id !== deleteProduct._id));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      setError(err.message || 'Ürün silinemedi');
    } finally {
      setDeleting(false);
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
                <h1 className="h4 mb-0">Ürünler</h1>
              </div>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Ara (ad, açıklama, marka, barkod)"
                  value={search}
                  onChange={e => { setPage(1); setSearch(e.target.value); }}
                  style={{ maxWidth: 320 }}
                />
                <button className="btn btn-erp" onClick={() => setShowCreate(true)}>Yeni Ürün</button>
              </div>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="card shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Ad</th>
                      <th>Barkod</th>
                      <th className="text-end">Toptan Fiyatı</th>
                      <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => toggleSort('sellingPrice')}>Satış Fiyatı</th>
                      <th className="text-end">Stok</th>
                      <th>Durum</th>
                      <th className="text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">Yükleniyor...</td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">Kayıt bulunamadı</td>
                      </tr>
                    ) : products.map(p => (
                      <tr key={p._id}>
                        <td><div className="fw-semibold">{p.name}</div></td>
                        <td><span className="badge badge-primary-soft">{p.barcode || p.sku}</span></td>
                        <td className="text-end">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.wholesalePrice || 0)}</td>
                        <td className="text-end">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.sellingPrice || 0)}</td>
                        <td className="text-end">{p.stockQuantity}</td>
                        <td>
                          {p.status === 'active' && <span className="badge text-bg-success">Aktif</span>}
                          {p.status === 'inactive' && <span className="badge text-bg-secondary">Pasif</span>}
                          {p.status === 'discontinued' && <span className="badge text-bg-warning">Durduruldu</span>}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm" role="group">
                            <button className="btn btn-outline-secondary" title="Görüntüle" onClick={() => openView(p)}>Gör</button>
                            <button className="btn btn-outline-primary" title="Düzenle" onClick={() => openEdit(p)}>Düzenle</button>
                            <button className="btn btn-outline-danger" title="Sil" onClick={() => openDelete(p)}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-footer d-flex justify-content-between align-items-center">
                <div className="small text-muted">Toplam {total} kayıt</div>
                <div className="btn-group" role="group">
                  <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Önceki</button>
                  <span className="btn btn-outline-secondary disabled">{page} / {pages}</span>
                  <button className="btn btn-outline-secondary" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Sonraki</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showCreate && createPortal((
      <>
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Yeni Ürün</h5>
              <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {createError && <div className="alert alert-danger">{createError}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Ad</label>
                    <input className="form-control" required value={form.name} onChange={e => {
                      const nextName = e.target.value;
                      setForm(prev => {
                        const next = { ...prev, name: nextName };
                        if (!skuTouched) {
                          next.sku = generateSku(nextName, prev.sellingPrice);
                        }
                        return next;
                      });
                    }} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Barkod</label>
                    <div className="input-group">
                      <input className="form-control" required readOnly value={form.barcode} />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => {
                        const code = generateEAN13();
                        setForm(prev => ({ ...prev, barcode: code, sku: code }));
                        setSkuTouched(true);
                      }}>Yenile</button>
                    </div>
                    <div className="form-text">Otomatik oluşturulur. İsterseniz yenileyebilirsiniz.</div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Satış Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" required value={form.sellingPrice} onChange={e => {
                      const val = e.target.value;
                      setForm(prev => {
                        const next = { ...prev, sellingPrice: val };
                        if (!skuTouched) {
                          next.sku = generateSku(prev.name, val);
                        }
                        return next;
                      });
                    }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Toptan Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.wholesalePrice} onChange={e => setForm({ ...form, wholesalePrice: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Stok</label>
                    <input type="number" min="0" className="form-control" required value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Birim</label>
                    <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                      <option value="adet">adet</option>
                      <option value="kg">kg</option>
                      <option value="metre">metre</option>
                      <option value="litre">litre</option>
                      <option value="kutu">kutu</option>
                      <option value="paket">paket</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Durum</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                      <option value="discontinued">Durduruldu</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreate(false)} disabled={creating}>İptal</button>
                <button type="submit" className="btn btn-erp" disabled={creating}>{creating ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </>
    ), document.body)}

    {showView && viewProduct && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Ürün Detayı</h5>
              <button type="button" className="btn-close" onClick={() => setShowView(false)}></button>
            </div>
            <div className="modal-body">
              <div className="mb-2"><strong>Ad:</strong> {viewProduct.name}</div>
              <div className="mb-2"><strong>Barkod:</strong> <span className="badge badge-primary-soft">{viewProduct.barcode || viewProduct.sku}</span></div>
              <div className="mb-2"><strong>Satış Fiyatı:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(viewProduct.sellingPrice || 0)}</div>
              <div className="mb-2"><strong>Toptan Fiyatı:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(viewProduct.wholesalePrice || 0)}</div>
              <div className="mb-2"><strong>Stok:</strong> {viewProduct.stockQuantity} {viewProduct.unit}</div>
              <div className="mb-2"><strong>Durum:</strong> {viewProduct.status === 'active' ? 'Aktif' : viewProduct.status === 'inactive' ? 'Pasif' : 'Durduruldu'}</div>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowView(false)}>Kapat</button>
            </div>
          </div>
        </div>
      </div>
    ), document.body)}

    {showEdit && editProduct && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Ürün Düzenle</h5>
              <button type="button" className="btn-close" onClick={() => setShowEdit(false)}></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                {updateError && <div className="alert alert-danger">{updateError}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Ad</label>
                    <input className="form-control" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Barkod</label>
                    <div className="input-group">
                      <input className="form-control" required readOnly value={editForm.barcode} />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => {
                        const code = generateEAN13();
                        setEditForm(prev => ({ ...prev, barcode: code, sku: code }));
                      }}>Yenile</button>
                    </div>
                    <div className="form-text">Otomatik oluşturulur. İsterseniz yenileyebilirsiniz.</div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Satış Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" required value={editForm.sellingPrice} onChange={e => setEditForm({ ...editForm, sellingPrice: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Toptan Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={editForm.wholesalePrice} onChange={e => setEditForm({ ...editForm, wholesalePrice: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Stok</label>
                    <input type="number" min="0" className="form-control" required value={editForm.stockQuantity} onChange={e => setEditForm({ ...editForm, stockQuantity: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Birim</label>
                    <select className="form-select" value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })}>
                      <option value="adet">adet</option>
                      <option value="kg">kg</option>
                      <option value="metre">metre</option>
                      <option value="litre">litre</option>
                      <option value="kutu">kutu</option>
                      <option value="paket">paket</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Durum</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                      <option value="discontinued">Durduruldu</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEdit(false)} disabled={updating}>İptal</button>
                <button type="submit" className="btn btn-erp" disabled={updating}>{updating ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    ), document.body)}

    {showDelete && deleteProduct && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Ürünü Sil</h5>
              <button type="button" className="btn-close" onClick={() => setShowDelete(false)}></button>
            </div>
            <div className="modal-body">
              <p><strong>{deleteProduct.name}</strong> ürününü silmek istediğinize emin misiniz?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDelete(false)} disabled={deleting}>İptal</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Siliniyor...' : 'Sil'}</button>
            </div>
          </div>
        </div>
      </div>
    ), document.body)}
    </>
  );
}


