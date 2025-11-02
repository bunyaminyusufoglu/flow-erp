import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';

export default function Accounts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 12;

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);

  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Transactions
  const [txList, setTxList] = useState([]);
  const [txSummary, setTxSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [txForm, setTxForm] = useState({ date: today(), description: '', type: 'income', amount: '', category: '' });
  const [txError, setTxError] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Statement (Ekstre)
  const [showStmt, setShowStmt] = useState(false);
  const [stmtList, setStmtList] = useState([]);
  const [stmtLoading, setStmtLoading] = useState(false);
  const [stmtError, setStmtError] = useState('');
  const [stmtPage, setStmtPage] = useState(1);
  const [stmtPages, setStmtPages] = useState(1);
  const [stmtTotal, setStmtTotal] = useState(0);
  const [stmtSummary, setStmtSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [stmtFilters, setStmtFilters] = useState({ startDate: '', endDate: '', type: '', category: '', minAmount: '', maxAmount: '', search: '' });

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
        if (search) params.set('search', search);
        const res = await fetch(`${apiBase}/api/accounts?${params.toString()}`);
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Hata');
        setAccounts(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (e) {
        if (!mounted) return;
        setError('Cari hesaplar yüklenemedi.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [apiBase, page, sortBy, sortOrder, search]);

  // Kategorileri çek
  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const res = await fetch(`${apiBase}/api/categories?status=active&limit=1000`);
        const data = await res.json();
        if (!mounted) return;
        if (data?.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      } catch {}
    }
    loadCategories();
    return () => { mounted = false; };
  }, [apiBase]);

  const anyModal = showCreate || showEdit || showDelete || showTx;
  useEffect(() => {
    if (anyModal) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [anyModal]);

  function openCreate() {
    setForm(emptyForm());
    setFormError('');
    setShowCreate(true);
  }

  function openEdit(acc) {
    setActiveAccount(acc);
    setForm(fillForm(acc));
    setFormError('');
    setShowEdit(true);
  }

  function openDelete(acc) {
    setActiveAccount(acc);
    setShowDelete(true);
  }

  async function openTransactions(acc) {
    setActiveAccount(acc);
    await loadTransactions(acc._id);
    setShowTx(true);
  }

  async function openStatement(acc) {
    setActiveAccount(acc);
    setStmtPage(1);
    setStmtFilters(f => ({ ...f, startDate: '', endDate: '', type: '', category: '', minAmount: '', maxAmount: '', search: '' }));
    await loadStatement(acc._id, 1, stmtFilters);
    setShowStmt(true);
  }

  async function loadTransactions(accountId) {
    try {
      setTxLoading(true);
      setTxError('');
      const res = await fetch(`${apiBase}/api/accounts/${accountId}/transactions?page=1&limit=100`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'İşlemler alınamadı');
      setTxList(data.data || []);
      setTxSummary(data.summary || { income: 0, expense: 0, balance: 0 });
      setTxForm({ date: today(), description: '', type: 'income', amount: '', category: '' });
    } catch (e) {
      setTxError(e.message || 'İşlemler alınamadı');
    } finally {
      setTxLoading(false);
    }
  }

  async function loadStatement(accountId, pageArg = 1, filtersArg) {
    const filters = filtersArg || stmtFilters;
    try {
      setStmtLoading(true);
      setStmtError('');
      const params = new URLSearchParams({ page: String(pageArg), limit: String(20) });
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.type) params.set('type', filters.type);
      if (filters.category) params.set('category', filters.category);
      if (filters.minAmount) params.set('minAmount', filters.minAmount);
      if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);
      if (filters.search) params.set('search', filters.search);
      const res = await fetch(`${apiBase}/api/accounts/${accountId}/transactions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Ekstre alınamadı');
      setStmtList(data.data || []);
      setStmtSummary(data.summary || { income: 0, expense: 0, balance: 0 });
      setStmtPage(data.page || 1);
      setStmtPages(data.pages || 1);
      setStmtTotal(data.total || 0);
    } catch (e) {
      setStmtError(e.message || 'Ekstre alınamadı');
    } finally {
      setStmtLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setCreating(true);
      setFormError('');
      const payload = buildPayload(form);
      const res = await fetch(`${apiBase}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Kaydetme hatası');
      setShowCreate(false);
      setPage(1);
      setSearch(s => s);
    } catch (e) {
      setFormError(e.message || 'Cari hesap eklenemedi');
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!activeAccount) return;
    try {
      setUpdating(true);
      setFormError('');
      const payload = buildPayload(form);
      const res = await fetch(`${apiBase}/api/accounts/${activeAccount._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Güncelleme hatası');
      setShowEdit(false);
      setSearch(s => s);
    } catch (e) {
      setFormError(e.message || 'Cari hesap güncellenemedi');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!activeAccount) return;
    try {
      setDeleting(true);
      const res = await fetch(`${apiBase}/api/accounts/${activeAccount._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Silme hatası');
      setShowDelete(false);
      setAccounts(prev => prev.filter(a => a._id !== activeAccount._id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e) {
      setError(e.message || 'Cari hesap silinemedi');
    } finally {
      setDeleting(false);
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    if (!activeAccount) return;
    try {
      setTxError('');
      const amountNum = Number(txForm.amount || 0);
      if (!txForm.date || !txForm.description || amountNum <= 0 || !txForm.category) {
        setTxError('Tarih, açıklama, tutar ve kategori gereklidir.');
        return;
      }
      const payload = {
        date: txForm.date,
        description: txForm.description,
        type: txForm.type,
        amount: amountNum,
        category: txForm.category || undefined
      };
      const res = await fetch(`${apiBase}/api/accounts/${activeAccount._id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'İşlem eklenemedi');
      await loadTransactions(activeAccount._id);
    } catch (e) {
      setTxError(e.message || 'İşlem eklenemedi');
    }
  }

  async function removeTransaction(id) {
    if (!activeAccount) return;
    try {
      setTxError('');
      const res = await fetch(`${apiBase}/api/accounts/${activeAccount._id}/transactions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'İşlem silinemedi');
      await loadTransactions(activeAccount._id);
    } catch (e) {
      setTxError(e.message || 'İşlem silinemedi');
    }
  }

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
                <h1 className="h4 mb-0">Cari Hesaplar</h1>
                <div className="d-flex gap-2">
                  <input
                    className="form-control"
                    placeholder="Ara (ad, kod)"
                    value={search}
                    onChange={e => { setPage(1); setSearch(e.target.value); }}
                    style={{ maxWidth: 320 }}
                  />
                  <button className="btn btn-erp" onClick={openCreate}>Yeni Cari</button>
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
              ) : accounts.length === 0 ? (
                <div className="text-center text-muted py-5">Kayıt bulunamadı</div>
              ) : (
                <div className="row g-3">
                  {accounts.map(acc => (
                    <div className="col-12 col-md-6 col-lg-4" key={acc._id}>
                      <div className="card h-100 shadow-sm">
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-semibold">{acc.name}</div>
                              <div className="small text-muted">Kod: <span className="badge badge-primary-soft">{acc.code}</span></div>
                            </div>
                            <span className={`badge ${acc.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>{statusLabel(acc.status)}</span>
                          </div>
                          <div className="small text-muted mb-3">Tür: {typeLabel(acc.type)}</div>
                          <div className="mt-auto d-flex gap-2">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => openTransactions(acc)}>İşlemler</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => openStatement(acc)}>Ekstre</button>
                            <button className="btn btn-outline-primary btn-sm" onClick={() => openEdit(acc)}>Düzenle</button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => openDelete(acc)}>Sil</button>
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
                <h5 className="modal-title">{showEdit ? 'Cari Düzenle' : 'Yeni Cari'}</h5>
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
                      <label className="form-label">Tür</label>
                      <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                        <option value="customer">Müşteri</option>
                        <option value="supplier">Tedarikçi</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Durum</label>
                      <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Açılış Bakiyesi</label>
                      <input type="number" min="0" step="0.01" className="form-control" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Telefon</label>
                      <input className="form-control" value={form.contact.phone} onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">E-posta</label>
                      <input type="email" className="form-control" value={form.contact.email} onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Sorumlu</label>
                      <input className="form-control" value={form.contact.responsible} onChange={e => setForm({ ...form, contact: { ...form.contact, responsible: e.target.value } })} />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Notlar</label>
                      <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea>
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

    {showStmt && activeAccount && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Ekstre • {activeAccount.name}</h5>
              <button type="button" className="btn-close" onClick={() => setShowStmt(false)}></button>
            </div>
            <div className="modal-body">
              <form className="row g-2 align-items-end" onSubmit={e => { e.preventDefault(); loadStatement(activeAccount._id, 1, stmtFilters); }}>
                <div className="col-md-2">
                  <label className="form-label">Başlangıç</label>
                  <input type="date" className="form-control" value={stmtFilters.startDate} onChange={e => setStmtFilters({ ...stmtFilters, startDate: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Bitiş</label>
                  <input type="date" className="form-control" value={stmtFilters.endDate} onChange={e => setStmtFilters({ ...stmtFilters, endDate: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Tür</label>
                  <select className="form-select" value={stmtFilters.type} onChange={e => setStmtFilters({ ...stmtFilters, type: e.target.value })}>
                    <option value="">Hepsi</option>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Kategori</label>
                  <select className="form-select" value={stmtFilters.category} onChange={e => setStmtFilters({ ...stmtFilters, category: e.target.value })}>
                    <option value="">Hepsi</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Açıklama</label>
                  <input className="form-control" placeholder="Ara" value={stmtFilters.search} onChange={e => setStmtFilters({ ...stmtFilters, search: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Min Tutar</label>
                  <input type="number" step="0.01" className="form-control" value={stmtFilters.minAmount} onChange={e => setStmtFilters({ ...stmtFilters, minAmount: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Max Tutar</label>
                  <input type="number" step="0.01" className="form-control" value={stmtFilters.maxAmount} onChange={e => setStmtFilters({ ...stmtFilters, maxAmount: e.target.value })} />
                </div>
                <div className="col-md-2 d-grid">
                  <button type="submit" className="btn btn-erp" disabled={stmtLoading}>Uygula</button>
                </div>
                <div className="col-md-2 d-grid">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setStmtFilters({ startDate: '', endDate: '', type: '', category: '', minAmount: '', maxAmount: '', search: '' }); loadStatement(activeAccount._id, 1, { startDate: '', endDate: '', type: '', category: '', minAmount: '', maxAmount: '', search: '' }); }} disabled={stmtLoading}>Sıfırla</button>
                </div>
              </form>

              {stmtError && <div className="alert alert-danger mt-2">{stmtError}</div>}

              <div className="d-flex gap-3 my-3">
                <div className="badge text-bg-secondary">Gelir: {formatTRY(stmtSummary.income)}</div>
                <div className="badge text-bg-warning">Gider: {formatTRY(stmtSummary.expense)}</div>
                <div className={`badge ${stmtSummary.balance >= 0 ? 'text-bg-success' : 'text-bg-danger'}`}>Bakiye: {formatTRY(stmtSummary.balance)}</div>
                <div className="small text-muted ms-auto">Toplam {stmtTotal} kayıt</div>
              </div>

              {stmtLoading ? (
                <div className="text-center text-muted py-4">Yükleniyor...</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Tarih</th>
                        <th>Açıklama</th>
                        <th>Tür</th>
                        <th>Kategori</th>
                        <th className="text-end">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stmtList.length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-muted py-3">Kayıt yok</td></tr>
                      ) : stmtList.map(t => (
                        <tr key={t._id}>
                          <td>{formatDateTR(t.date)}</td>
                          <td>{t.description}</td>
                          <td>{t.type === 'income' ? <span className="badge text-bg-success">Gelir</span> : <span className="badge text-bg-warning">Gider</span>}</td>
                          <td>{t.category?.name || '-'}</td>
                          <td className="text-end">{formatTRY(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-between">
              <div>
                <button className="btn btn-outline-secondary me-2" disabled={stmtPage <= 1} onClick={() => { const next = Math.max(1, stmtPage - 1); setStmtPage(next); loadStatement(activeAccount._id, next); }}>Önceki</button>
                <button className="btn btn-outline-secondary" disabled={stmtPage >= stmtPages} onClick={() => { const next = Math.min(stmtPages, stmtPage + 1); setStmtPage(next); loadStatement(activeAccount._id, next); }}>Sonraki</button>
                <span className="ms-2 small text-muted">{stmtPage} / {stmtPages}</span>
              </div>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowStmt(false)}>Kapat</button>
            </div>
          </div>
        </div>
      </div>
    ), document.body)}

      {showDelete && createPortal((
        <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content bg-white">
              <div className="modal-header">
                <h5 className="modal-title">Cariyi Sil</h5>
                <button type="button" className="btn-close" onClick={() => setShowDelete(false)}></button>
              </div>
              <div className="modal-body">
                {activeAccount && <p><strong>{activeAccount.name}</strong> kaydını silmek istediğinize emin misiniz?</p>}
                <p className="small text-muted mb-0">Not: İşlem (gelir/gider) varsa silme engellenir.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDelete(false)} disabled={deleting}>İptal</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Siliniyor...' : 'Sil'}</button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {showTx && activeAccount && createPortal((
        <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-white">
              <div className="modal-header">
                <h5 className="modal-title">İşlemler • {activeAccount.name}</h5>
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
                  <div className="col-md-3">
                    <label className="form-label">Kategori</label>
                    <select className="form-select" required value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })}>
                      <option value="">Seçiniz</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-1 d-grid">
                    <button type="submit" className="btn btn-erp" disabled={txLoading}>Ekle</button>
                  </div>
                </form>
                {txError && <div className="alert alert-danger mt-2">{txError}</div>}

                <div className="d-flex gap-3 my-3">
                  <div className="badge text-bg-secondary">Gelir: {formatTRY(txSummary.income)}</div>
                  <div className="badge text-bg-warning">Gider: {formatTRY(txSummary.expense)}</div>
                  <div className={`badge ${txSummary.balance >= 0 ? 'text-bg-success' : 'text-bg-danger'}`}>Bakiye: {formatTRY(txSummary.balance)}</div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Tarih</th>
                        <th>Açıklama</th>
                        <th>Tür</th>
                        <th>Kategori</th>
                        <th className="text-end">Tutar</th>
                        <th className="text-end">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txList.length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-muted py-3">Kayıt yok</td></tr>
                      ) : txList.map(t => (
                        <tr key={t._id}>
                          <td>{formatDateTR(t.date)}</td>
                          <td>{t.description}</td>
                          <td>{t.type === 'income' ? <span className="badge text-bg-success">Gelir</span> : <span className="badge text-bg-warning">Gider</span>}</td>
                          <td>{t.category?.name || '-'}</td>
                          <td className="text-end">{formatTRY(t.amount)}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeTransaction(t._id)} disabled={txLoading}>Sil</button>
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

function emptyForm() {
  return {
    name: '',
    code: '',
    type: 'customer',
    status: 'active',
    openingBalance: 0,
    contact: { phone: '', email: '', responsible: '' },
    notes: ''
  };
}

function fillForm(acc) {
  return {
    name: acc.name || '',
    code: acc.code || '',
    type: acc.type || 'customer',
    status: acc.status || 'active',
    openingBalance: acc.openingBalance ?? 0,
    contact: {
      phone: acc.contact?.phone || '',
      email: acc.contact?.email || '',
      responsible: acc.contact?.responsible || ''
    },
    notes: acc.notes || ''
  };
}

function buildPayload(f) {
  return {
    name: f.name,
    code: f.code,
    type: f.type,
    status: f.status,
    openingBalance: Number(f.openingBalance || 0),
    contact: { phone: f.contact.phone || undefined, email: f.contact.email || undefined, responsible: f.contact.responsible || undefined },
    notes: f.notes || undefined
  };
}

function statusLabel(s) {
  if (s === 'active') return 'Aktif';
  if (s === 'inactive') return 'Pasif';
  return s || '-';
}

function typeLabel(t) {
  if (t === 'customer') return 'Müşteri';
  if (t === 'supplier') return 'Tedarikçi';
  if (t === 'other') return 'Diğer';
  return t || '-';
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

function today() {
  return new Date().toISOString().slice(0, 10);
}


