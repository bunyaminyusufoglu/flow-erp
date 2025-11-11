import { NavLink, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  function closeMobileSidebar() {
    try {
      document.body.classList.remove('sidebar-open');
    } catch {}
  }

  const desktopSidebar = (
    <div className="d-none d-lg-flex flex-column bg-light border-end vh-100 app-sidebar" style={{ width: 260 }}>
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

        <NavLink to="/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Cari Hesaplar
        </NavLink>
        
        <NavLink to="/shipments" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Sevkiyatlar
        </NavLink>

        <NavLink to="/barcodes" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Barkod Oluştur
        </NavLink>
        
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
          Ayarlar
        </NavLink>
      </nav>

      <div className="mt-auto p-3 border-top">
        <button className="btn btn-outline-danger w-100" onClick={handleLogout}>Çıkış Yap</button>
      </div>
    </div>
  );

  const mobileSidebar = createPortal((
    <>
      <div className="app-sidebar bg-light border-end d-lg-none">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-bold sidebar-brand mb-0">Flow ERP</div>
            <small className="text-muted">Yönetim</small>
          </div>
          <button className="btn btn-outline-secondary btn-sm d-lg-none" onClick={closeMobileSidebar}>Kapat</button>
        </div>

        <nav className="nav flex-column p-2 gap-1">
          <NavLink to="/dashboard" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Ana Sayfa
          </NavLink>

          <NavLink to="/barcodes" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Barkod Oluştur
          </NavLink>

          <NavLink to="/categories" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Kategoriler
          </NavLink>

          <NavLink to="/products" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Ürünler
          </NavLink>
          
          <NavLink to="/stores" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Mağazalar
          </NavLink>
          <NavLink to="/accounts" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Cari Hesaplar
          </NavLink>
          <NavLink to="/shipments" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Sevkiyatlar
          </NavLink>
          
          <NavLink to="/settings" onClick={closeMobileSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
            Ayarlar
          </NavLink>
        </nav>

        <div className="mt-auto p-3 border-top">
          <button className="btn btn-outline-danger w-100" onClick={() => { closeMobileSidebar(); handleLogout(); }}>Çıkış Yap</button>
        </div>
      </div>
      <div className="sidebar-backdrop d-lg-none" onClick={closeMobileSidebar}></div>
    </>
  ), document.body);

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}


