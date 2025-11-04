import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';

export default function Shipments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shipments, setShipments] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 10;

  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [form, setForm] = useState(createEmptyShipmentForm());

  // View modal state
  const [showView, setShowView] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [viewError, setViewError] = useState('');
  const [detail, setDetail] = useState(null);
  const [priceType, setPriceType] = useState('selling'); // 'purchase' | 'selling' | 'wholesale'

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyShipmentForm());

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  useEffect(() => {
    let isMounted = true;
    async function fetchShipments() {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
        if (search) params.set('search', search);
        const res = await fetch(`${apiBase}/api/shipments?${params.toString()}`);
        const data = await res.json();
        if (!isMounted) return;
        if (!data?.success) throw new Error(data?.message || 'Hata');
        setShipments(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (e) {
        if (!isMounted) return;
        setError('Sevkiyatlar yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchShipments();
    return () => { isMounted = false; };
  }, [apiBase, page, search, sortBy, sortOrder]);

  useEffect(() => {
    // preload stores and products for selects
    let cancelled = false;
    async function preload() {
      try {
        const [sRes, pRes] = await Promise.all([
          fetch(`${apiBase}/api/stores?limit=1000&sortBy=name&sortOrder=asc`),
          fetch(`${apiBase}/api/products?limit=1000&sortBy=name&sortOrder=asc`)
        ]);
        const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
        if (cancelled) return;
        if (sData?.success) setStores(sData.data || []);
        if (pData?.success) setProducts(pData.data || []);
      } catch {
        if (!cancelled) {
          setStores([]);
          setProducts([]);
        }
      }
    }
    preload();
    return () => { cancelled = true; };
  }, [apiBase]);

  useEffect(() => {
    if (showCreate || showView || showEdit) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showCreate, showView, showEdit]);

  function toggleSort(field) {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { product: '', quantity: 1 }] });
  }
  function removeItem(index) {
    const next = [...form.items];
    next.splice(index, 1);
    setForm({ ...form, items: next });
  }
  function changeItem(index, patch) {
    const next = [...form.items];
    next[index] = { ...next[index], ...patch };
    next[index].quantity = Number(next[index].quantity || 0);
    setForm({ ...form, items: next });
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError('');
      const payload = {
        shipmentNumber: form.shipmentNumber || undefined,
        fromStore: form.fromStore,
        toStore: form.toStore,
        items: form.items.map(it => ({
          product: it.product,
          quantity: Number(it.quantity || 0)
        })),
        expectedDeliveryDate: form.expectedDeliveryDate
      };
      const res = await fetch(`${apiBase}/api/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const details = Array.isArray(data?.errors) ? data.errors.map(err => err.msg).join(', ') : '';
        const serverError = typeof data?.error === 'string' ? data.error : '';
        throw new Error(details || serverError || data?.message || 'Kaydetme hatası');
      }
      setShowCreate(false);
      setForm(createEmptyShipmentForm());
      setPage(1);
      setSearch(s => s);
    } catch (err) {
      setCreateError(err.message || 'Sevkiyat eklenemedi');
    } finally {
      setCreating(false);
    }
  }

  async function openView(id) {
    try {
      setShowView(true);
      setViewing(true);
      setViewError('');
      const res = await fetch(`${apiBase}/api/shipments/${id}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Detay yüklenemedi');
      setDetail(data.data);
      setPriceType('selling');
    } catch (err) {
      setViewError(err.message || 'Detay yüklenemedi');
    } finally {
      setViewing(false);
    }
  }

  function closeView() {
    setShowView(false);
    setDetail(null);
    setViewError('');
    setPriceType('selling');
  }

  function getUnitPriceForItem(item) {
    const p = item?.product || {};
    if (priceType === 'purchase') return Number(p.purchasePrice || 0);
    if (priceType === 'wholesale') return Number(p.wholesalePrice || 0);
    return Number(p.sellingPrice || 0);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value || 0));
  }

  const computed = (() => {
    const items = (detail?.items || []).map(it => {
      const unitPrice = getUnitPriceForItem(it);
      const lineTotal = unitPrice * Number(it.quantity || 0);
      return { ...it, __unitPrice: unitPrice, __lineTotal: lineTotal };
    });
    const subtotal = items.reduce((s, it) => s + it.__lineTotal, 0);
    return { items, subtotal };
  })();

  function exportDetailToExcel() {
    if (!detail) return;

    const priceLabel = priceType === 'purchase' ? 'Alış' : priceType === 'wholesale' ? 'Toptan' : 'Satış';

    // Tek sayfada (Sevkiyat) özet + kalemler
    const aoa = [
      ['Sevkiyat No', detail.shipmentNumber || ''],
      ['Çıkan Mağaza', `${detail.fromStore?.name || ''} (${detail.fromStore?.code || ''})`],
      ['Giren Mağaza', `${detail.toStore?.name || ''} (${detail.toStore?.code || ''})`],
      ['Durum', detail.status || ''],
      ['Teslim Tarihi', detail.expectedDeliveryDate ? new Date(detail.expectedDeliveryDate).toLocaleDateString('tr-TR') : ''],
      ['Ara Toplam', computed.subtotal],
      [],
      ['Ürün', 'SKU', 'Miktar', `Birim Fiyat (${priceLabel})`, 'Satır Toplamı']
    ];

    computed.items.forEach(it => {
      aoa.push([
        it.product?.name || '',
        it.product?.sku || '',
        Number(it.quantity || 0),
        it.__unitPrice,
        it.__lineTotal
      ]);
    });

    // Ara toplam satırı
    aoa.push([]);
    aoa.push(['', '', '', 'Ara Toplam', computed.subtotal]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'Sevkiyat');

    const fileName = `Sevkiyat_${detail.shipmentNumber || 'detay'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  async function applyPricesAndSave() {
    if (!detail?._id) return;
    try {
      const payload = {
        fromStore: detail.fromStore?._id || detail.fromStore,
        toStore: detail.toStore?._id || detail.toStore,
        expectedDeliveryDate: detail.expectedDeliveryDate ? new Date(detail.expectedDeliveryDate).toISOString().slice(0, 10) : undefined,
        items: (detail.items || []).map((it, idx) => ({
          product: (it.product && (it.product._id || it.product)) || '',
          quantity: Number(it.quantity || 0),
          unitPrice: computed.items[idx].__unitPrice,
          totalPrice: computed.items[idx].__lineTotal
        })),
        subtotal: computed.subtotal,
        totalAmount: computed.subtotal
      };
      const res = await fetch(`${apiBase}/api/shipments/${detail._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const details = Array.isArray(data?.errors) ? data.errors.map(err => err.msg).join(', ') : '';
        const serverError = typeof data?.error === 'string' ? data.error : '';
        throw new Error(details || serverError || data?.message || 'Kaydetme hatası');
      }
      // Refresh view with latest data
      setDetail(data.data);
    } catch (err) {
      setViewError(err.message || 'Fiyatlar uygulanamadı');
    }
  }

  async function openEdit(id) {
    try {
      setShowEdit(true);
      setEditId(id);
      setUpdateError('');
      const res = await fetch(`${apiBase}/api/shipments/${id}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Detay yüklenemedi');
      const d = data.data || {};
      setEditForm({
        shipmentNumber: d.shipmentNumber || '',
        fromStore: d.fromStore?._id || '',
        toStore: d.toStore?._id || '',
        items: Array.isArray(d.items) && d.items.length > 0 ? d.items.map(it => ({
          product: (it.product && (it.product._id || it.product)) || '',
          quantity: Number(it.quantity || 1)
        })) : [{ product: '', quantity: 1 }],
        expectedDeliveryDate: d.expectedDeliveryDate ? new Date(d.expectedDeliveryDate).toISOString().slice(0, 10) : ''
      });
    } catch (err) {
      setUpdateError(err.message || 'Detay yüklenemedi');
    }
  }

  function addEditItem() {
    setEditForm({ ...editForm, items: [...editForm.items, { product: '', quantity: 1 }] });
  }
  function removeEditItem(index) {
    const next = [...editForm.items];
    next.splice(index, 1);
    setEditForm({ ...editForm, items: next });
  }
  function changeEditItem(index, patch) {
    const next = [...editForm.items];
    next[index] = { ...next[index], ...patch };
    next[index].quantity = Number(next[index].quantity || 0);
    setEditForm({ ...editForm, items: next });
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      setUpdating(true);
      setUpdateError('');
      const payload = {
        shipmentNumber: editForm.shipmentNumber || undefined,
        fromStore: editForm.fromStore,
        toStore: editForm.toStore,
        items: editForm.items.map(it => ({
          product: it.product,
          quantity: Number(it.quantity || 0)
        })),
        expectedDeliveryDate: editForm.expectedDeliveryDate
      };
      const res = await fetch(`${apiBase}/api/shipments/${editId}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const details = Array.isArray(data?.errors) ? data.errors.map(err => err.msg).join(', ') : '';
        const serverError = typeof data?.error === 'string' ? data.error : '';
        throw new Error(details || serverError || data?.message || 'Güncelleme hatası');
      }
      setShowEdit(false);
      setEditId(null);
      setEditForm(createEmptyShipmentForm());
      setPage(p => p); // refresh
    } catch (err) {
      setUpdateError(err.message || 'Sevkiyat güncellenemedi');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm('Sevkiyatı silmek istediğinize emin misiniz?');
    if (!ok) return;
    try {
      const res = await fetch(`${apiBase}/api/shipments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Silme hatası');
      setPage(p => p); // refresh current page
    } catch (err) {
      setError(err.message || 'Sevkiyat silinemedi');
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
              <h1 className="h4 mb-0">Sevkiyatlar</h1>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Ara (sevkiyat no)"
                  value={search}
                  onChange={e => { setPage(1); setSearch(e.target.value); }}
                  style={{ maxWidth: 320 }}
                />
                <button className="btn btn-erp" onClick={() => setShowCreate(true)}>Yeni Sevkiyat</button>
              </div>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="card shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('shipmentNumber')}>Sevkiyat No</th>
                      <th>Çıkan</th>
                      <th>Giren</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">Yükleniyor...</td>
                      </tr>
                    ) : shipments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">Kayıt bulunamadı</td>
                      </tr>
                    ) : shipments.map(s => (
                      <tr key={s._id}>
                        <td className="fw-semibold">{s.shipmentNumber}</td>
                        <td>{s.fromStore?.name} ({s.fromStore?.code})</td>
                        <td>{s.toStore?.name} ({s.toStore?.code})</td>
                        <td>
                          {s.status === 'pending' && <span className="badge text-bg-secondary">Bekliyor</span>}
                          {s.status === 'preparing' && <span className="badge text-bg-warning">Hazırlanıyor</span>}
                          {s.status === 'shipped' && <span className="badge text-bg-info">Kargolandı</span>}
                          {s.status === 'delivered' && <span className="badge text-bg-success">Teslim</span>}
                          {s.status === 'cancelled' && <span className="badge text-bg-danger">İptal</span>}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <button className="btn btn-outline-secondary" onClick={() => openView(s._id)}>Görüntüle</button>
                            <button className="btn btn-outline-primary" onClick={() => openEdit(s._id)}>Düzenle</button>
                            <button className="btn btn-outline-danger" onClick={() => handleDelete(s._id)}>Sil</button>
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
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Yeni Sevkiyat</h5>
              <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {createError && <div className="alert alert-danger">{createError}</div>}

                <div className="row g-3 mb-2">
                  <div className="col-md-4">
                    <label className="form-label">Çıkan Mağaza</label>
                    <select className="form-select" required value={form.fromStore} onChange={e => setForm({ ...form, fromStore: e.target.value })}>
                      <option value="">Seçiniz</option>
                      {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Giren Mağaza</label>
                    <select className="form-select" required value={form.toStore} onChange={e => setForm({ ...form, toStore: e.target.value })}>
                      <option value="">Seçiniz</option>
                      {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Sevkiyat No</label>
                    <input className="form-control" placeholder="(Boş bırakılırsa otomatik)" value={form.shipmentNumber} onChange={e => setForm({ ...form, shipmentNumber: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Teslim Tarihi</label>
                    <input type="date" className="form-control" required value={form.expectedDeliveryDate} onChange={e => setForm({ ...form, expectedDeliveryDate: e.target.value })} />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Ürün</th>
                        <th style={{ width: 160 }} className="text-end">Miktar</th>
                        <th style={{ width: 80 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <select className="form-select" required value={it.product} onChange={e => changeItem(idx, { product: e.target.value })}>
                              <option value="">Ürün seçin</option>
                              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td>
                            <input type="number" min="1" className="form-control text-end" required value={it.quantity} onChange={e => changeItem(idx, { quantity: e.target.value })} />
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={addItem}>Satır Ekle</button>
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
    ), document.body)}

    {showView && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Sevkiyat Detayı</h5>
              <button type="button" className="btn-close" onClick={closeView}></button>
            </div>
            <div className="modal-body">
              {viewError && <div className="alert alert-danger">{viewError}</div>}
              {viewing ? (
                <div className="text-muted">Yükleniyor...</div>
              ) : detail ? (
                <>
                  <div className="row g-3 mb-2">
                    <div className="col-md-4"><strong>Sevkiyat No:</strong> {detail.shipmentNumber}</div>
                    <div className="col-md-4"><strong>Çıkan:</strong> {detail.fromStore?.name} ({detail.fromStore?.code})</div>
                    <div className="col-md-4"><strong>Giren:</strong> {detail.toStore?.name} ({detail.toStore?.code})</div>
                    <div className="col-md-4"><strong>Teslim Tarihi:</strong> {detail.expectedDeliveryDate ? new Date(detail.expectedDeliveryDate).toLocaleDateString() : '-'}</div>
                    <div className="col-md-4">
                      <strong>Durum:</strong> {' '}
                      {detail.status ? (
                        detail.status === 'pending' ? <span className="badge text-bg-secondary">Bekliyor</span> :
                        detail.status === 'preparing' ? <span className="badge text-bg-warning">Hazırlanıyor</span> :
                        detail.status === 'shipped' ? <span className="badge text-bg-info">Kargolandı</span> :
                        detail.status === 'delivered' ? <span className="badge text-bg-success">Teslim</span> :
                        detail.status === 'cancelled' ? <span className="badge text-bg-danger">İptal</span> : '-' ) : '-' }
                    </div>
                    <div className="col-md-4">
                      <label className="form-label d-block mb-1"><strong>Fiyat Türü</strong></label>
                      <select className="form-select" value={priceType} onChange={e => setPriceType(e.target.value)}>
                        <option value="selling">Satış</option>
                        <option value="wholesale">Toptan</option>
                        <option value="purchase">Alış</option>
                      </select>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Ürün</th>
                          <th className="text-end" style={{ width: 160 }}>Miktar</th>
                          <th className="text-end" style={{ width: 160 }}>Birim Fiyat</th>
                          <th className="text-end" style={{ width: 160 }}>Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {computed.items.map((it, idx) => (
                          <tr key={idx}>
                            <td>{it.product?.name ? `${it.product.name} (${it.product.sku})` : it.product}</td>
                            <td className="text-end">{it.quantity}</td>
                            <td className="text-end">{formatMoney(it.__unitPrice)}</td>
                            <td className="text-end">{formatMoney(it.__lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="row g-3 mt-2">
                    <div className="col d-flex align-items-end justify-content-end">
                      <div className="text-end w-100">
                        <div><strong>Ara Toplam:</strong> {formatMoney(computed.subtotal)}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={closeView}>Kapat</button>
              <button type="button" className="btn btn-outline-success" onClick={exportDetailToExcel}>Excel'e Aktar</button>
              <button type="button" className="btn btn-erp" onClick={applyPricesAndSave}>Fiyatları Uygula ve Kaydet</button>
            </div>
          </div>
        </div>
      </div>
    ), document.body)}

    {showEdit && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Sevkiyat Düzenle</h5>
              <button type="button" className="btn-close" onClick={() => setShowEdit(false)}></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {updateError && <div className="alert alert-danger">{updateError}</div>}
                <div className="row g-3 mb-2">
                  <div className="col-md-4">
                    <label className="form-label">Çıkan Mağaza</label>
                    <select className="form-select" required value={editForm.fromStore} onChange={e => setEditForm({ ...editForm, fromStore: e.target.value })}>
                      <option value="">Seçiniz</option>
                      {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Giren Mağaza</label>
                    <select className="form-select" required value={editForm.toStore} onChange={e => setEditForm({ ...editForm, toStore: e.target.value })}>
                      <option value="">Seçiniz</option>
                      {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Sevkiyat No</label>
                    <input className="form-control" placeholder="(Boş bırakılırsa otomatik)" value={editForm.shipmentNumber} onChange={e => setEditForm({ ...editForm, shipmentNumber: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Teslim Tarihi</label>
                    <input type="date" className="form-control" required value={editForm.expectedDeliveryDate} onChange={e => setEditForm({ ...editForm, expectedDeliveryDate: e.target.value })} />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Ürün</th>
                        <th style={{ width: 160 }} className="text-end">Miktar</th>
                        <th style={{ width: 80 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editForm.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <select className="form-select" required value={it.product} onChange={e => changeEditItem(idx, { product: e.target.value })}>
                              <option value="">Ürün seçin</option>
                              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td>
                            <input type="number" min="1" className="form-control text-end" required value={it.quantity} onChange={e => changeEditItem(idx, { quantity: e.target.value })} />
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeEditItem(idx)}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={addEditItem}>Satır Ekle</button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEdit(false)} disabled={updating}>İptal</button>
                <button type="submit" className="btn btn-erp" disabled={updating}>{updating ? 'Güncelleniyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    ), document.body)}
    </>
  );
}

function createEmptyShipmentForm() {
  const today = new Date();
  const nextDay = new Date(today.getTime() + 24*60*60*1000);
  return {
    shipmentNumber: '',
    fromStore: '',
    toStore: '',
    items: [{ product: '', quantity: 1 }],
    expectedDeliveryDate: nextDay.toISOString().slice(0, 10)
  };
}
