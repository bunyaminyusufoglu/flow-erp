import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ products: 0, categories: 0, stores: 0, shipments: 0 });
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:2000', []);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        setLoading(true);
        setError('');

        const [prodRes, catRes, storeRes, shipRes] = await Promise.all([
          fetch(`${apiBase}/api/products?limit=1`),
          fetch(`${apiBase}/api/categories?limit=1`),
          fetch(`${apiBase}/api/stores?limit=1`),
          fetch(`${apiBase}/api/shipments?limit=1`)
        ]);

        const [prodJson, catJson, storeJson, shipJson] = await Promise.all([
          prodRes.json(), catRes.json(), storeRes.json(), shipRes.json()
        ]);

        if (!isMounted) return;

        setCounts({
          products: prodJson?.total || 0,
          categories: catJson?.total || 0,
          stores: storeJson?.total || 0,
          shipments: shipJson?.total || 0
        });

        // Shipment stats removed from dashboard
      } catch (e) {
        if (!isMounted) return;
        setError('İstatistikler yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStats();
    return () => { isMounted = false; };
  }, [apiBase]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-auto p-0 d-none d-lg-block">
          <Sidebar />
        </div>
        <div className="col">
          <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary d-lg-none" onClick={() => { try { document.body.classList.add('sidebar-open'); } catch {} }}>☰</button>
              <h1 className="h4 mb-0">Ana Sayfa</h1>
            </div>
            <button className="btn btn-outline-danger" onClick={handleLogout}>Çıkış Yap</button>
      </div>

          <div className="card shadow-sm mb-4 bg-erp-soft">
            <div className="card-body">
              <p className="mb-1">Hoş geldin, <strong className="text-erp">{user?.username || 'kullanıcı'}</strong>!</p>
              <small className="text-muted">Soldaki menüyü kullanarak modüllere gidebilirsin.</small>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card kpi-card h-100 shadow-sm">
                <div className="card-body">
                  <div className="kpi-title">Ürünler</div>
                  <div className="kpi-value mb-1">{loading ? '...' : counts.products}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card kpi-card h-100 shadow-sm">
                <div className="card-body">
                  <div className="kpi-title">Kategoriler</div>
                  <div className="kpi-value mb-1">{loading ? '...' : counts.categories}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card kpi-card h-100 shadow-sm">
                <div className="card-body">
                  <div className="kpi-title">Mağazalar</div>
                  <div className="kpi-value mb-1">{loading ? '...' : counts.stores}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card kpi-card h-100 shadow-sm">
                <div className="card-body">
                  <div className="kpi-title">Sevkiyatlar</div>
                  <div className="kpi-value mb-1">{loading ? '...' : counts.shipments}</div>
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