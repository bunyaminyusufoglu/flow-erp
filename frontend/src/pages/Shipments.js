import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';

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
    if (showCreate) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showCreate]);

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
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Kaydetme hatası');
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
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">Yükleniyor...</td>
                      </tr>
                    ) : shipments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">Kayıt bulunamadı</td>
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
