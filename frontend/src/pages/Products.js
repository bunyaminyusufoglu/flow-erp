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
    description: '',
    sku: '',
    brand: '',
    purchasePrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    stockQuantity: '',
    unit: 'adet',
    status: 'active'
  });

  // View/Edit state
  const [showView, setShowView] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sku: '',
    brand: '',
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
      const body = {
        name: form.name,
        description: form.description,
        sku: form.sku?.toUpperCase(),
        brand: form.brand,
        purchasePrice: Number(form.purchasePrice || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        wholesalePrice: form.wholesalePrice === '' ? undefined : Number(form.wholesalePrice),
        stockQuantity: Number(form.stockQuantity || 0),
        unit: form.unit,
        status: form.status
      };
      const res = await fetch(`${apiBase}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Kaydetme hatası');
      }
      // Başarılı: listeyi yenile
      setShowCreate(false);
      setForm({ name: '', description: '', sku: '', brand: '', purchasePrice: '', sellingPrice: '', wholesalePrice: '', stockQuantity: '', unit: 'adet', status: 'active' });
      setPage(1);
      // trigger fetch (effect deps)
      setSearch(s => s);
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
      description: product.description || '',
      sku: product.sku || '',
      brand: product.brand || '',
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
      const body = {
        name: editForm.name,
        description: editForm.description,
        sku: editForm.sku?.toUpperCase(),
        brand: editForm.brand,
        purchasePrice: Number(editForm.purchasePrice || 0),
        sellingPrice: Number(editForm.sellingPrice || 0),
        wholesalePrice: editForm.wholesalePrice === '' ? undefined : Number(editForm.wholesalePrice),
        stockQuantity: Number(editForm.stockQuantity || 0),
        unit: editForm.unit,
        status: editForm.status
      };
      const res = await fetch(`${apiBase}/api/products/${editProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Güncelleme hatası');
      }
      // Update list in place
      setProducts(prev => prev.map(p => p._id === data.data._id ? data.data : p));
      setShowEdit(false);
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
        <div className="col-auto p-0">
          <Sidebar />
        </div>
        <div className="col">
          <div className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h1 className="h4 mb-0">Ürünler</h1>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Ara (ad, açıklama, marka, SKU)"
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
                      <th>SKU</th>
                      <th>Marka</th>
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
                        <td>
                          <div className="fw-semibold">{p.name}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 420 }}>{p.description}</div>
                        </td>
                        <td><span className="badge badge-primary-soft">{p.sku}</span></td>
                        <td>{p.brand}</td>
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
                    <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Marka</label>
                    <input className="form-control" required value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Açıklama</label>
                    <textarea className="form-control" rows="2" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">SKU</label>
                    <input className="form-control" required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Alış Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" required value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Satış Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" required value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
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
              <div className="mb-2"><strong>Marka:</strong> {viewProduct.brand}</div>
              <div className="mb-2"><strong>SKU:</strong> <span className="badge badge-primary-soft">{viewProduct.sku}</span></div>
              <div className="mb-2"><strong>Satış Fiyatı:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(viewProduct.sellingPrice || 0)}</div>
              <div className="mb-2"><strong>Alış Fiyatı:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(viewProduct.purchasePrice || 0)}</div>
                <div className="mb-2"><strong>Toptan Fiyatı:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(viewProduct.wholesalePrice || 0)}</div>
              <div className="mb-2"><strong>Stok:</strong> {viewProduct.stockQuantity} {viewProduct.unit}</div>
              <div className="mb-2"><strong>Durum:</strong> {viewProduct.status === 'active' ? 'Aktif' : viewProduct.status === 'inactive' ? 'Pasif' : 'Durduruldu'}</div>
              <div className="mb-2"><strong>Açıklama:</strong><br />{viewProduct.description}</div>
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
                  <div className="col-md-6">
                    <label className="form-label">Marka</label>
                    <input className="form-control" required value={editForm.brand} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Açıklama</label>
                    <textarea className="form-control" rows="2" required value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">SKU</label>
                    <input className="form-control" required value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Alış Fiyatı</label>
                    <input type="number" min="0" step="0.01" className="form-control" required value={editForm.purchasePrice} onChange={e => setEditForm({ ...editForm, purchasePrice: e.target.value })} />
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


