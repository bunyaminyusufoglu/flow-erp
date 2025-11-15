# Flow ERP Frontend

React tabanlı Flow ERP arayüzü. Ürün, kategori, mağaza, sevkiyat ve cari (gelir/gider) modüllerini içerir. Arka uç (API) ile `REACT_APP_API_URL` üzerinden haberleşir.

## Gereksinimler
- Node.js 18+ (önerilir)
- npm 9+ veya pnpm/yarn
- Çalışır durumda bir backend API (varsayılan: `http://localhost:2000`)

## Kurulum
1. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
2. Ortam değişkenini tanımlayın (isteğe bağlı):
   `.env` dosyası oluşturun:
   ```
   REACT_APP_API_URL=http://localhost:2000
   ```
   Eğer tanımlanmazsa uygulama varsayılan olarak `http://localhost:2000` adresini kullanır.

## Geliştirme
Uygulamayı geliştirme modunda başlatın:
```
npm start
```
Tarayıcıdan `http://localhost:3000` adresine gidin. API için backend’in çalıştığından emin olun.

## Build (Prod)
Optimize prod derleme oluşturur:
```
npm run build
```
Oluşan statik dosyalar `build/` klasöründedir. Herhangi bir statik sunucuda servis edebilirsiniz.

## Sayfalar ve Modüller
- Dashboard: genel istatistikler (`/src/pages/Dashboard.js`)
- Ürünler: listele/ekle/düzenle/sil (`/src/pages/Products.js`)
- Kategoriler: listeleme (`/src/pages/Categories.js`)
- Mağazalar: listeleme (`/src/pages/Stores.js`)
- Sevkiyatlar: oluşturma/detay/Excel aktarımı (`/src/pages/Shipments.js`)
- Cari Hesaplar: cari, işlem, ekstre, Excel aktarımı (`/src/pages/Accounts.js`)
- Giriş: JWT tabanlı basit oturum (`/src/pages/Login.js`, `/src/services/auth.js`)

Ortak bileşenler:
- Sidebar (`/src/components/Sidebar.js`)
- Tema stilleri (`/src/theme.css`)

## Kimlik Doğrulama
Giriş sonrası `localStorage` içinde `token` ve `user` saklanır. Rotalar basit bir kontrol ile (token var mı) yönlendirme yapar. API çağrılarında gerekli ise Authorization header eklemeyi projeye entegre edebilirsiniz (örn. interceptor).

## API Uçları (beklenen)
Frontend varsayılan olarak backend’te şu uçları kullanır:
- `GET/POST/PUT/DELETE /api/products`
- `GET /api/categories`
- `GET /api/stores`
- `GET/POST/PUT/DELETE /api/shipments`
- `GET/POST/PUT/DELETE /api/accounts`
- `POST /api/auth/login`, `POST /api/auth/register`

## Sık Karşılaşılan Sorunlar
- Boş sayfa/istek hataları: `REACT_APP_API_URL` yanlış veya backend kapalı olabilir.
- CORS hatası: Backend’te CORS izinlerini doğrulayın.
- 401/403: Token eksik/süresi dolmuş; tekrar giriş yapın.
- Build sonrasında boş sayfa: Sunucu tarafında SPA yönlendirmesini (`index.html`) doğru yapılandırın.

## Komutlar
- `npm start` — Geliştirme sunucusu
- `npm run build` — Üretim derlemesi
