const API_URL = process.env.REACT_APP_API_URL;

/**
 * Basit kimlik doğrulama:
 * - Önce kullanıcı tarafından kaydedilmiş yerel kimlik bilgileri (Settings)
 * - Yoksa sabit geliştirme bilgileri (admin / admin12345)
 * - Uyuşmazsa backend'e POST /api/auth/login denemesi (varsa)
 */
export async function login(username, password) {
  // 1) Kullanıcı tarafından ayarlanan yerel kimlik bilgileri
  try {
    const raw = localStorage.getItem('customCredentials');
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.username && saved?.password && username === saved.username && password === saved.password) {
        return {
          success: true,
          token: 'dev-admin-token',
          user: { id: saved.id || '1', username: saved.username, role: saved.role || 'admin' }
        };
      }
    }
  } catch {}

  // 2) Yerel (sabit) geliştirme bilgileri
  if (username === 'admin' && password === 'admin12345') {
    return {
      success: true,
      token: 'dev-admin-token',
      user: { id: '1', username: 'admin', role: 'admin' }
    };
  }

  // 3) Backend (opsiyonel)
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Backend'in beklediği gövdeye göre 'username' / 'email' alanını uyarlayın
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Sunucu yoksa sessizce hatayı yoksay ve aşağı düş
  }

  return { success: false, message: 'Kullanıcı adı veya şifre hatalı.' };
}