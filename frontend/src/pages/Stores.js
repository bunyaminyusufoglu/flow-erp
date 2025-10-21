import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';

export default function Stores() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stores, setStores] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 12; // grid

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const [activeStore, setActiveStore] = useState(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState(createEmptyStoreForm());

  // Transactions state (local-only)
  const [txList, setTxList] = useState([]);
  const [txForm, setTxForm] = useState({ date: '', description: '', type: 'income', amount: '' });
  const [txError, setTxError] = useState('');

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  useEffect(() => {
    let isMounted = true;
    async function fetchStores() {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
        if (search) params.set('search', search);
        const res = await fetch(`${apiBase}/api/stores?${params.toString()}`);
        const data = await res.json();
        if (!isMounted) return;
        if (!data?.success) throw new Error(data?.message || 'Hata');
        setStores(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (e) {
        if (!isMounted) return;
        setError('Mağazalar yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStores();
    return () => { isMounted = false; };
  }, [apiBase, page, search, sortBy, sortOrder]);

  // Body scroll lock for any modal
  const anyModal = showCreate || showEdit || showDelete || showTx;
  useEffect(() => {
    if (anyModal) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [anyModal]);

  function openCreate() {
    setForm(createEmptyStoreForm());
    setFormError('');
    setShowCreate(true);
  }

  function openEdit(store) {
    setActiveStore(store);
    setForm(fillFormFromStore(store));
    setFormError('');
    setShowEdit(true);
  }

  function openDelete(store) {
    setActiveStore(store);
    setShowDelete(true);
  }

  function openTransactions(store) {
    setActiveStore(store);
    const list = getTransactions(store._id);
    setTxList(list);
    setTxForm({ date: new Date().toISOString().slice(0, 10), description: '', type: 'income', amount: '' });
    setTxError('');
    setShowTx(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setCreating(true);
      setFormError('');
      const body = buildStorePayload(form);
      const res = await fetch(`${apiBase}/api/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Kaydetme hatası');
      setShowCreate(false);
      setPage(1);
      setSearch(s => s);
    } catch (err) {
      setFormError(err.message || 'Mağaza eklenemedi');
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!activeStore) return;
    try {
      setUpdating(true);
      setFormError('');
      const body = buildStorePayload(form);
      const res = await fetch(`${apiBase}/api/stores/${activeStore._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Güncelleme hatası');
      setShowEdit(false);
      // trigger refresh
      setSearch(s => s);
    } catch (err) {
      setFormError(err.message || 'Mağaza güncellenemedi');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!activeStore) return;
    try {
      setDeleting(true);
      const res = await fetch(`${apiBase}/api/stores/${activeStore._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Silme hatası');
      setShowDelete(false);
      // trigger refresh
      setStores(prev => prev.filter(s => s._id !== activeStore._id));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      setError(err.message || 'Mağaza silinemedi');
    } finally {
      setDeleting(false);
    }
  }

  // Transactions (localStorage)
  function getTxKey(storeId) {
    return `store-transactions:${storeId}`;
  }
  function getTransactions(storeId) {
    try {
      const raw = localStorage.getItem(getTxKey(storeId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function saveTransactions(storeId, list) {
    localStorage.setItem(getTxKey(storeId), JSON.stringify(list));
  }
  function addTransaction(e) {
    e.preventDefault();
    if (!activeStore) return;
    try {
      setTxError('');
      const amountNum = Number(txForm.amount || 0);
      if (!txForm.date || !txForm.description || amountNum <= 0) {
        setTxError('Tarih, açıklama ve tutar gereklidir.');
        return;
      }
      const tx = {
        id: cryptoRandomId(),
        date: txForm.date,
        description: txForm.description,
        type: txForm.type, // 'income' | 'expense'
        amount: amountNum
      };
      const next = [tx, ...txList];
      setTxList(next);
      saveTransactions(activeStore._id, next);
      setTxForm({ ...txForm, description: '', amount: '' });
    } catch (err) {
      setTxError('İşlem eklenemedi');
    }
  }
  function removeTransaction(id) {
    if (!activeStore) return;
    const next = txList.filter(t => t.id !== id);
    setTxList(next);
    saveTransactions(activeStore._id, next);
  }
  const txTotals = computeTotals(txList);

  function toggleSort(field) {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
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
              <h1 className="h4 mb-0">Mağazalar</h1>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Ara (ad, kod)"
                  value={search}
                  onChange={e => { setPage(1); setSearch(e.target.value); }}
                  style={{ maxWidth: 320 }}
                />
                <button className="btn btn-erp" onClick={openCreate}>Yeni Mağaza</button>
              </div>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="small text-muted">Toplam {total} kayıt</div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Sırala:</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleSort('createdAt')}>Tarih</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleSort('name')}>Ad</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleSort('code')}>Kod</button>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-muted py-5">Yükleniyor...</div>
            ) : stores.length === 0 ? (
              <div className="text-center text-muted py-5">Kayıt bulunamadı</div>
            ) : (
              <div className="row g-3">
                {stores.map(store => (
                  <div className="col-12 col-md-6 col-lg-4" key={store._id}>
                    <div className="card h-100 shadow-sm">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="fw-semibold">{store.name}</div>
                            <div className="small text-muted">Kod: <span className="badge badge-primary-soft">{store.code}</span></div>
                          </div>
                          <span className={`badge ${store.status === 'active' ? 'text-bg-success' : store.status === 'inactive' ? 'text-bg-secondary' : 'text-bg-warning'}`}>{statusLabel(store.status)}</span>
                        </div>
                        <div className="small text-muted mb-3">
                          {store.address?.city}, {store.address?.state} • {typeLabel(store.type)}
                        </div>
                        <div className="mt-auto d-flex gap-2">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => openTransactions(store)}>İşlemler</button>
                          <button className="btn btn-outline-primary btn-sm" onClick={() => openEdit(store)}>Düzenle</button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => openDelete(store)}>Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Önceki</button>
              <span className="btn btn-outline-secondary disabled">{page} / {pages}</span>
              <button className="btn btn-outline-secondary" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Sonraki</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {(showCreate || showEdit) && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">{showEdit ? 'Mağaza Düzenle' : 'Yeni Mağaza'}</h5>
              <button type="button" className="btn-close" onClick={() => { setShowCreate(false); setShowEdit(false); }}></button>
            </div>
            <form onSubmit={showEdit ? handleUpdate : handleCreate}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Ad</label>
                    <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kod</label>
                    <input className="form-control" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Telefon</label>
                    <input className="form-control" required value={form.contact.phone} onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">E-posta</label>
                    <input type="email" className="form-control" required value={form.contact.email} onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Müdür</label>
                    <input className="form-control" required value={form.contact.manager} onChange={e => setForm({ ...form, contact: { ...form.contact, manager: e.target.value } })} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Adres</label>
                    <input className="form-control" required value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Şehir</label>
                    <input className="form-control" required value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">İl</label>
                    <input className="form-control" required value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Posta Kodu</label>
                    <input className="form-control" required value={form.address.zipCode} onChange={e => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Ülke</label>
                    <input className="form-control" required value={form.address.country} onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Tip</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="store">Mağaza</option>
                      <option value="warehouse">Depo</option>
                      <option value="branch">Şube</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Durum</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                      <option value="maintenance">Bakımda</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notlar</label>
                    <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }} disabled={creating || updating}>İptal</button>
                <button type="submit" className="btn btn-erp" disabled={creating || updating}>{(creating || updating) ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    ), document.body)}

    {showDelete && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Mağazayı Sil</h5>
              <button type="button" className="btn-close" onClick={() => setShowDelete(false)}></button>
            </div>
            <div className="modal-body">
              {activeStore && <p><strong>{activeStore.name}</strong> mağazasını silmek istediğinize emin misiniz?</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDelete(false)} disabled={deleting}>İptal</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Siliniyor...' : 'Sil'}</button>
            </div>
          </div>
        </div>
      </div>
    ), document.body)}

    {showTx && activeStore && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">İşlemler • {activeStore.name}</h5>
              <button type="button" className="btn-close" onClick={() => setShowTx(false)}></button>
            </div>
            <div className="modal-body">
              <form className="row g-2 align-items-end" onSubmit={addTransaction}>
                <div className="col-md-3">
                  <label className="form-label">Tarih</label>
                  <input type="date" className="form-control" required value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Açıklama</label>
                  <input className="form-control" required value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Tür</label>
                  <select className="form-select" value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Tutar (TL)</label>
                  <input type="number" min="0" step="0.01" className="form-control" required value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
                </div>
                <div className="col-md-1 d-grid">
                  <button type="submit" className="btn btn-erp">Ekle</button>
                </div>
              </form>
              {txError && <div className="alert alert-danger mt-2">{txError}</div>}

              <div className="d-flex gap-3 my-3">
                <div className="badge text-bg-secondary">Gelir: {formatTRY(txTotals.income)}</div>
                <div className="badge text-bg-warning">Gider: {formatTRY(txTotals.expense)}</div>
                <div className={`badge ${txTotals.balance >= 0 ? 'text-bg-success' : 'text-bg-danger'}`}>Bakiye: {formatTRY(txTotals.balance)}</div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Tarih</th>
                      <th>Açıklama</th>
                      <th>Tür</th>
                      <th className="text-end">Tutar</th>
                      <th className="text-end">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txList.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted py-3">Kayıt yok</td></tr>
                    ) : txList.map(t => (
                      <tr key={t.id}>
                        <td>{formatDateTR(t.date)}</td>
                        <td>{t.description}</td>
                        <td>
                          {t.type === 'income' ? <span className="badge text-bg-success">Gelir</span> : <span className="badge text-bg-warning">Gider</span>}
                        </td>
                        <td className="text-end">{formatTRY(t.amount)}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeTransaction(t.id)}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowTx(false)}>Kapat</button>
            </div>
          </div>
        </div>
      </div>
    ), document.body)}
    </>
  );
}

function createEmptyStoreForm() {
  return {
    name: '',
    code: '',
    contact: { phone: '', email: '', manager: '' },
    address: { street: '', city: '', state: '', zipCode: '', country: 'Türkiye' },
    type: 'store',
    status: 'active',
    notes: ''
  };
}

function fillFormFromStore(store) {
  return {
    name: store.name || '',
    code: store.code || '',
    contact: {
      phone: store.contact?.phone || '',
      email: store.contact?.email || '',
      manager: store.contact?.manager || ''
    },
    address: {
      street: store.address?.street || '',
      city: store.address?.city || '',
      state: store.address?.state || '',
      zipCode: store.address?.zipCode || '',
      country: store.address?.country || 'Türkiye'
    },
    type: store.type || 'store',
    status: store.status || 'active',
    notes: store.notes || ''
  };
}

function buildStorePayload(form) {
  return {
    name: form.name,
    code: form.code,
    contact: { phone: form.contact.phone, email: form.contact.email, manager: form.contact.manager },
    address: { street: form.address.street, city: form.address.city, state: form.address.state, zipCode: form.address.zipCode, country: form.address.country },
    type: form.type,
    status: form.status,
    notes: form.notes || undefined
  };
}

function statusLabel(status) {
  if (status === 'active') return 'Aktif';
  if (status === 'inactive') return 'Pasif';
  if (status === 'maintenance') return 'Bakımda';
  return status || '-';
}

function typeLabel(type) {
  if (type === 'store') return 'Mağaza';
  if (type === 'warehouse') return 'Depo';
  if (type === 'branch') return 'Şube';
  return type || '-';
}

function formatTRY(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
}

function formatDateTR(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR');
  } catch {
    return dateStr;
  }
}

function computeTotals(list) {
  const income = list
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const expense = list
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  return { income, expense, balance: income - expense };
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(n => n.toString(16)).join('');
  }
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}
