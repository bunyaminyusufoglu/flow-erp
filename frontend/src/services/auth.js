const API_URL = process.env.REACT_APP_API_URL;

// Sadece backend tabanlı kimlik doğrulama
export async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || 'Giriş başarısız.'
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: err?.message || 'Sunucuya ulaşılamıyor.'
    };
  }
}