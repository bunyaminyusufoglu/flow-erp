import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ 
    products: 0, 
    categories: 0, 
    stores: 0, 
    shipments: 0,
    activeProducts: 0,
    lowStockCount: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [shipmentStats, setShipmentStats] = useState({ totalRevenue: 0, pending: 0, delivered: 0 });
  
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

        // Ana istatistikler
        const [prodRes, catRes, storeRes, shipRes] = await Promise.all([
          fetch(`${apiBase}/api/products?limit=1`),
          fetch(`${apiBase}/api/categories?limit=1`),
          fetch(`${apiBase}/api/stores?limit=1`),
          fetch(`${apiBase}/api/shipments?limit=1`)
        ]);

        const [prodJson, catJson, storeJson, shipJson] = await Promise.all([
          prodRes.json(), catRes.json(), storeRes.json(), shipRes.json()
        ]);

        // Son ürünler ve düşük stok
        const [recentRes, allProductsRes] = await Promise.all([
          fetch(`${apiBase}/api/products?limit=5&sortBy=createdAt&sortOrder=desc`),
          fetch(`${apiBase}/api/products?limit=1000`)
        ]);
        const [recentJson, allProductsJson] = await Promise.all([
          recentRes.json(), allProductsRes.json()
        ]);

        // Sevkiyat istatistikleri
        let stats = { totalRevenue: 0, pending: 0, delivered: 0 };
        try {
          const statsRes = await fetch(`${apiBase}/api/shipments/stats`);
          const statsJson = await statsRes.json();
          if (statsJson?.success && statsJson?.data) {
            stats = {
              totalRevenue: statsJson.data.totalRevenue || 0,
              pending: statsJson.data.statusBreakdown?.find(s => s._id === 'pending')?.count || 0,
              delivered: statsJson.data.statusBreakdown?.find(s => s._id === 'delivered')?.count || 0
            };
          }
        } catch (e) {
          // Silently handle missing stats
        }

        if (!isMounted) return;

        // Aktif ürün sayısı ve düşük stok hesaplama
        const products = allProductsJson?.data || [];
        const activeProducts = products.filter(p => p.status === 'active').length;
        const lowStock = products.filter(p => {
          if (p.status !== 'active') return false;
          const stock = p.stockQuantity || 0;
          const minStock = p.minStockLevel || 5;
          return stock <= minStock;
        });

        setCounts({
          products: prodJson?.total || 0,
          categories: catJson?.total || 0,
          stores: storeJson?.total || 0,
          shipments: shipJson?.total || 0,
          activeProducts,
          lowStockCount: lowStock.length
        });

        setRecentProducts(recentJson?.data || []);
        setLowStockProducts(lowStock.slice(0, 5));
        setShipmentStats(stats);

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
                <h1 className="h4 mb-0">Dashboard</h1>
              </div>
              <button className="btn btn-outline-danger" onClick={handleLogout}>Çıkış Yap</button>
            </div>

            {/* Hoş Geldin Mesajı */}
            <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
              <div className="card-body text-white">
                <div>
                  <h5 className="mb-1">Hoş geldin, <strong>{user?.username || 'kullanıcı'}</strong>!</h5>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {/* KPI Kartları */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #4f46e5 !important' }}>
                  <div className="card-body">
                    <div>
                      <div className="text-muted small mb-1">Toplam Ürün</div>
                      <div className="h3 mb-0 fw-bold" style={{ color: '#4f46e5' }}>
                        {loading ? <span className="spinner-border spinner-border-sm" /> : counts.products}
                      </div>
                      <div className="text-muted small mt-2">
                        <span className="badge bg-success-subtle text-success">{counts.activeProducts} aktif</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #16a34a !important' }}>
                  <div className="card-body">
                    <div>
                      <div className="text-muted small mb-1">Kategoriler</div>
                      <div className="h3 mb-0 fw-bold" style={{ color: '#16a34a' }}>
                        {loading ? <span className="spinner-border spinner-border-sm" /> : counts.categories}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0ea5e9 !important' }}>
                  <div className="card-body">
                    <div>
                      <div className="text-muted small mb-1">Mağazalar</div>
                      <div className="h3 mb-0 fw-bold" style={{ color: '#0ea5e9' }}>
                        {loading ? <span className="spinner-border spinner-border-sm" /> : counts.stores}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #f59e0b !important' }}>
                  <div className="card-body">
                    <div>
                      <div className="text-muted small mb-1">Sevkiyatlar</div>
                      <div className="h3 mb-0 fw-bold" style={{ color: '#f59e0b' }}>
                        {loading ? <span className="spinner-border spinner-border-sm" /> : counts.shipments}
                      </div>
                      <div className="text-muted small mt-2">
                        <span className="badge bg-warning-subtle text-warning">{shipmentStats.pending} beklemede</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Uyarılar ve Özet */}
            <div className="row g-3 mb-4">
              {/* Düşük Stok Uyarısı */}
              {lowStockProducts.length > 0 && (
                <div className="col-12 col-lg-6">
                  <div className="card border-warning shadow-sm">
                    <div className="card-header bg-warning-subtle d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-semibold">Düşük Stok Uyarısı</h6>
                      <span className="badge bg-warning">{counts.lowStockCount} ürün</span>
                    </div>
                    <div className="card-body">
                      <div className="list-group list-group-flush">
                        {lowStockProducts.map(p => (
                          <div key={p._id} className="list-group-item px-0 py-2 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold">{p.name}</div>
                                <small className="text-muted">Barkod: {p.barcode || p.sku}</small>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-danger">
                                  {p.stockQuantity || 0} {p.unit || 'adet'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Link to="/products" className="btn btn-sm btn-warning">
                          Tüm Ürünleri Gör →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Son Eklenen Ürünler */}
              <div className="col-12 col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-semibold">Son Eklenen Ürünler</h6>
                    <Link to="/products" className="btn btn-sm btn-link text-decoration-none p-0">
                      Tümünü Gör →
                    </Link>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <div className="text-center py-3">
                        <span className="spinner-border spinner-border-sm text-muted" />
                      </div>
                    ) : recentProducts.length === 0 ? (
                      <p className="text-muted mb-0">Henüz ürün eklenmemiş</p>
                    ) : (
                      <div className="list-group list-group-flush">
                        {recentProducts.map(p => (
                          <div key={p._id} className="list-group-item px-0 py-2 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <div className="fw-semibold">{p.name}</div>
                                <small className="text-muted">
                                  {p.sku || p.barcode} • 
                                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.sellingPrice || 0)}
                                </small>
                              </div>
                              <span className={`badge ${p.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                {p.status === 'active' ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hızlı İşlemler */}
            <div className="row g-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 fw-semibold">Hızlı İşlemler</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6 col-md-3">
                        <Link to="/products" className="btn btn-outline-primary w-100">
                          <div className="fw-semibold">Yeni Ürün</div>
                        </Link>
                      </div>
                      <div className="col-6 col-md-3">
                        <Link to="/categories" className="btn btn-outline-success w-100">
                          <div className="fw-semibold">Kategori Ekle</div>
                        </Link>
                      </div>
                      <div className="col-6 col-md-3">
                        <Link to="/shipments" className="btn btn-outline-warning w-100">
                          <div className="fw-semibold">Sevkiyat</div>
                        </Link>
                      </div>
                      <div className="col-6 col-md-3">
                        <Link to="/stores" className="btn btn-outline-info w-100">
                          <div className="fw-semibold">Mağaza</div>
                        </Link>
                      </div>
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