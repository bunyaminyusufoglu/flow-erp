import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="d-flex flex-column bg-light border-end vh-100" style={{ width: 260 }}>
      <div className="p-3 border-bottom">
        <div className="fw-bold sidebar-brand">Flow ERP</div>
        <small className="text-muted">Yönetim</small>
      </div>

      <nav className="nav flex-column p-2 gap-1">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Ana Sayfa
        </NavLink>

        <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Kategoriler
        </NavLink>

        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Ürünler
        </NavLink>
        
        <NavLink to="/stores" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Mağazalar
        </NavLink>
        <NavLink to="/shipments" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Sevkiyatlar
        </NavLink>
      </nav>

      <div className="mt-auto p-3 border-top">
        <button className="btn btn-outline-danger w-100" onClick={handleLogout}>Çıkış Yap</button>
      </div>
    </div>
  );
}


