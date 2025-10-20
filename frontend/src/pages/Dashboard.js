import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ products: 0, categories: 0, stores: 0, shipments: 0 });
  const [shipmentStats, setShipmentStats] = useState({ totalShipments: 0, totalRevenue: 0, statusBreakdown: [] });
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

        const [prodRes, catRes, storeRes, shipRes, shipStatsRes] = await Promise.all([
          fetch(`${apiBase}/api/products?limit=1`),
          fetch(`${apiBase}/api/categories?limit=1`),
          fetch(`${apiBase}/api/stores?limit=1`),
          fetch(`${apiBase}/api/shipments?limit=1`),
          fetch(`${apiBase}/api/shipments/stats`)
        ]);

        const [prodJson, catJson, storeJson, shipJson, shipStatsJson] = await Promise.all([
          prodRes.json(), catRes.json(), storeRes.json(), shipRes.json(), shipStatsRes.json()
        ]);

        if (!isMounted) return;

        setCounts({
          products: prodJson?.total || 0,
          categories: catJson?.total || 0,
          stores: storeJson?.total || 0,
          shipments: shipJson?.total || 0
        });

        setShipmentStats({
          totalShipments: shipStatsJson?.data?.totalShipments || 0,
          totalRevenue: shipStatsJson?.data?.totalRevenue || 0,
          statusBreakdown: shipStatsJson?.data?.statusBreakdown || []
        });
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
        <div className="col-auto p-0">
          <Sidebar />
        </div>
        <div className="col">
          <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h4 mb-0">Ana Sayfa</h1>
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
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">Ürünler</div>
                  <div className="h3 mb-0">{loading ? '...' : counts.products}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">Kategoriler</div>
                  <div className="h3 mb-0">{loading ? '...' : counts.categories}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">Mağazalar</div>
                  <div className="h3 mb-0">{loading ? '...' : counts.stores}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">Sevkiyatlar</div>
                  <div className="h3 mb-0">{loading ? '...' : counts.shipments}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12 col-lg-6">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">Sevkiyat Durumları</div>
                    <span className="badge badge-primary-soft">Toplam: {shipmentStats.totalShipments}</span>
                  </div>
                  {loading ? (
                    <div className="text-muted">Yükleniyor...</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {shipmentStats.statusBreakdown?.length ? shipmentStats.statusBreakdown.map((s, idx) => (
                        <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
                          <span className="text-capitalize">{s._id}</span>
                          <span className="badge badge-accent-soft">{s.count}</span>
                        </li>
                      )) : (
                        <li className="list-group-item text-muted">Veri yok</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="fw-semibold mb-2">Toplam Gelir</div>
                  <div className="display-6">{loading ? '...' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(shipmentStats.totalRevenue || 0)}</div>
                  <small className="text-muted">Teslim edilen sevkiyatların toplam tutarı</small>
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