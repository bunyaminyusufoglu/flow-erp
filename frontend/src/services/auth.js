const API_URL = process.env.REACT_APP_API_URL;

/**
 * Basit kimlik doğrulama:
 * - Önce yerel kontrol (admin/admin12345)
 * - Uyuşmazsa backend'e POST /api/auth/login denemesi (varsa)
 */
export async function login(username, password) {
  // 1) Yerel (sabit) kontrol
  if (username === 'admin' && password === 'admin12345') {
    return {
      success: true,
      token: 'dev-admin-token',
      user: { id: '1', username: 'admin', role: 'admin' }
    };
  }

  // 2) Backend (opsiyonel)
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