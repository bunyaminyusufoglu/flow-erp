import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../components/Sidebar';

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const limit = 10;
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    status: 'active'
  });

  // Edit/Delete state
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    status: 'active'
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
        if (search) params.set('search', search);
        const res = await fetch(`${apiBase}/api/categories?${params.toString()}`);
        const data = await res.json();
        if (!isMounted) return;
        if (!data?.success) throw new Error(data?.message || 'Hata');
        setCategories(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (e) {
        if (!isMounted) return;
        setError('Kategoriler yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCategories();
    return () => { isMounted = false; };
  }, [apiBase, page, search, sortBy, sortOrder]);

  // Modal body-scroll yönetimi
  useEffect(() => {
    if (showCreate || showEdit || showDelete) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showCreate, showEdit, showDelete]);

  // Parent seçenekleri kaldırıldı (sade model)

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
        status: form.status
      };
      const res = await fetch(`${apiBase}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Kaydetme hatası');
      }
      setShowCreate(false);
      setForm({ name: '', status: 'active' });
      setPage(1);
      setSearch(s => s);
    } catch (err) {
      setCreateError(err.message || 'Kategori eklenemedi');
    } finally {
      setCreating(false);
    }
  }

  function openEdit(cat) {
    setActiveCategory(cat);
    setEditForm({
      name: cat.name || '',
      status: cat.status || 'active'
    });
    setUpdateError('');
    setShowEdit(true);
  }

  function openDelete(cat) {
    setActiveCategory(cat);
    setShowDelete(true);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!activeCategory) return;
    try {
      setUpdating(true);
      setUpdateError('');
      const body = {
        name: editForm.name,
        status: editForm.status
      };
      const res = await fetch(`${apiBase}/api/categories/${activeCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Güncelleme hatası');
      }
      setShowEdit(false);
      // Listeyi güncelle
      setCategories(prev => prev.map(c => c._id === data.data._id ? data.data : c));
    } catch (err) {
      setUpdateError(err.message || 'Kategori güncellenemedi');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!activeCategory) return;
    try {
      setDeleting(true);
      const res = await fetch(`${apiBase}/api/categories/${activeCategory._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Silme hatası');
      }
      setShowDelete(false);
      setCategories(prev => prev.filter(c => c._id !== activeCategory._id));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      setError(err.message || 'Kategori silinemedi');
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
                <h1 className="h4 mb-0">Kategoriler</h1>
              </div>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Ara (ad, açıklama)"
                  value={search}
                  onChange={e => { setPage(1); setSearch(e.target.value); }}
                  style={{ maxWidth: 320 }}
                />
                <button className="btn btn-erp" onClick={() => setShowCreate(true)}>Yeni Kategori</button>
              </div>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="card shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Ad</th>
                      <th className="text-center">Ürün</th>
                      <th>Durum</th>
                      <th className="text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">Yükleniyor...</td>
                      </tr>
                    ) : categories.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">Kayıt bulunamadı</td>
                      </tr>
                    ) : categories.map(c => (
                      <tr key={c._id}>
                        <td>
                          <div className="fw-semibold">{c.name}</div>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-accent-soft">{c.productCount ?? 0}</span>
                        </td>
                        <td>
                          {c.status === 'active' && <span className="badge text-bg-success">Aktif</span>}
                          {c.status === 'inactive' && <span className="badge text-bg-secondary">Pasif</span>}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm" role="group">
                            <button className="btn btn-outline-primary" onClick={() => openEdit(c)}>Düzenle</button>
                            <button className="btn btn-outline-danger" onClick={() => openDelete(c)}>Sil</button>
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
        <div className="modal-dialog">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Yeni Kategori</h5>
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
                    <label className="form-label">Durum</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
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

    {showEdit && activeCategory && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Kategori Düzenle</h5>
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
                    <label className="form-label">Durum</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
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

    {showDelete && activeCategory && createPortal((
      <div className="modal d-block" style={{ zIndex: 2000 }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <div className="modal-content bg-white">
            <div className="modal-header">
              <h5 className="modal-title">Kategoriyi Sil</h5>
              <button type="button" className="btn-close" onClick={() => setShowDelete(false)}></button>
            </div>
            <div className="modal-body">
              <p><strong>{activeCategory.name}</strong> kategorisini silmek istediğinize emin misiniz?</p>
              <p className="text-muted small mb-0">Not: Ürün bağlı ise silinemez.</p>
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
