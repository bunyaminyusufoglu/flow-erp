import Sidebar from '../components/Sidebar';
import { useMemo, useEffect, useState } from 'react';

export default function Settings() {
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const savedCreds = useMemo(() => {
    try {
      const raw = localStorage.getItem('customCredentials');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [form, setForm] = useState({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const initialUsername = savedCreds?.username || user?.username || 'admin';
    setForm({ username: initialUsername, currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [savedCreds, user]);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'system');

  function applyThemeChoice(mode) {
    const root = document.documentElement;
    let target = mode;
    if (mode === 'system') {
      target = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', target);
  }

  function handleThemeChange(e) {
    const mode = e.target.value;
    setThemeMode(mode);
    localStorage.setItem('theme', mode);
    applyThemeChoice(mode);
  }

  function validateAndBuild() {
    setError('');
    setMessage('');
    const username = (form.username || '').trim();
    if (!username) {
      setError('Kullanıcı adı zorunludur.');
      return null;
    }
    const currentPwdRef = savedCreds?.password || 'admin12345';
    const wantsToChangePassword = !!form.newPassword;
    const usernameChanged = username !== (savedCreds?.username || user?.username || 'admin');

    if (wantsToChangePassword || usernameChanged) {
      if (!form.currentPassword) {
        setError('Mevcut şifre gereklidir.');
        return null;
      }
      if (form.currentPassword !== currentPwdRef) {
        setError('Mevcut şifre hatalı.');
        return null;
      }
    }

    let nextPassword = currentPwdRef;
    if (wantsToChangePassword) {
      if (String(form.newPassword).length < 6) {
        setError('Yeni şifre en az 6 karakter olmalıdır.');
        return null;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('Yeni şifre ve tekrarı uyuşmuyor.');
        return null;
      }
      nextPassword = form.newPassword;
    }

    return { username, password: nextPassword };
  }

  function handleResetDefaults() {
    setError('');
    setMessage('');
    localStorage.removeItem('customCredentials');
    const name = user?.username || 'admin';
    setForm({ username: name, currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('Varsayılan bilgilere dönüldü (admin / admin12345).');
  }

  function handleSave(e) {
    e.preventDefault();
    const next = validateAndBuild();
    if (!next) return;
    setSaving(true);
    try {
      const nextPayload = { username: next.username, password: next.password, id: user?.id || '1', role: user?.role || 'admin' };
      localStorage.setItem('customCredentials', JSON.stringify(nextPayload));
      // Oturum bilgisi varsa kullanıcı adını güncelle
      try {
        const raw = localStorage.getItem('user');
        const u = raw ? JSON.parse(raw) : null;
        if (u) {
          localStorage.setItem('user', JSON.stringify({ ...u, username: next.username }));
        }
      } catch {}
      setMessage('Ayarlar kaydedildi. Bir sonraki girişte geçerli olacaktır.');
      setForm({ username: next.username, currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setSaving(false);
    }
  }

  return (
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
                <h1 className="h4 mb-0">Ayarlar</h1>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-3">Kullanıcı Bilgileri</h5>

                    {error && <div className="alert alert-danger">{error}</div>}
                    {message && <div className="alert alert-success">{message}</div>}

                    <form onSubmit={handleSave} className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Kullanıcı Adı</label>
                        <input className="form-control" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Mevcut Şifre</label>
                        <input type="password" className="form-control" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} placeholder="Değişiklik için gerekli" />
                        <div className="form-text">Kullanıcı adı veya şifre değişikliği için gerekli.</div>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">Yeni Şifre</label>
                        <input type="password" className="form-control" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Yeni Şifre (Tekrar)</label>
                        <input type="password" className="form-control" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                      </div>

                      <div className="col-12 d-flex gap-2">
                        <button type="submit" className="btn btn-erp" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                        <button type="button" className="btn btn-outline-secondary" onClick={handleResetDefaults} disabled={saving}>Varsayılana Dön</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-3">Sistem</h5>
                    <div className="mb-2">
                      <label className="form-label">Tema</label>
                      <select className="form-select" value={themeMode} onChange={handleThemeChange}>
                        <option value="system">Sistem (Otomatik)</option>
                        <option value="light">Açık</option>
                        <option value="dark">Koyu</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


