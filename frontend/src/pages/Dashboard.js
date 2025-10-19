import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Dashboard</h1>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <p className="mb-1">Hoş geldin, <strong>{user?.username || 'kullanıcı'}</strong>!</p>
          <small className="text-muted">Başlamak için sol menüyü veya üstteki seçenekleri kullanın.</small>
        </div>
      </div>
    </div>
  );
}