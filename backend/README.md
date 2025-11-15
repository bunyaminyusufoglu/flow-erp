# Flow ERP Backend

Express + MongoDB (Mongoose) tabanlı Flow ERP API.

## Gereksinimler
- Node.js 18+
- MongoDB 6+ (lokal veya Atlas)

## Hızlı Başlangıç
1) Bağımlılıkları yükleyin:
```
npm install
```
2) `.env` dosyasını oluşturun (aşağıdaki örneğe bakın).
3) Geliştirme modunda başlatın:
```
npm run dev
```
Sunucu: `http://localhost:2000`

## Ortam Değişkenleri (.env örneği)
```
PORT=2000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flow-erp
JWT_SECRET=degistir-bunu-uretimde-guclu-yap
JWT_EXPIRES_IN=7d
# CORS için önerilen (opsiyonel): tek origin belirtin
# CORS_ORIGIN=http://localhost:3000
```
Notlar:
- Üretimde `JWT_SECRET` güçlü ve gizli olmalıdır.
- Varsayılan CORS şu an geniştir; üretimde kökeni kısıtlamanız önerilir.

## Komutlar
- `npm start` — Production başlatma
- `npm run dev` — Geliştirme (nodemon)
- `npm run reset:users` — Örnek kullanıcıları sıfırlama (`scripts/resetUsers.js`)

## API Dokümanı
- Health: `GET /api/health`
- OpenAPI JSON: `GET /api/openapi.json`
- Statik API Docs: `GET /api/docs`

## Ana Uçlar
- Kimlik: `POST /api/auth/login`, `POST /api/auth/register`
- Ürünler: `GET/POST/PUT/DELETE /api/products`
- Kategoriler: `GET/POST/PUT/DELETE /api/categories`
- Mağazalar: `GET/POST/PUT/DELETE /api/stores`
- Sevkiyatlar: `GET/POST/PUT/DELETE /api/shipments`
- Stok Hareketleri: `GET /api/stock-movements`
- Cari Hesaplar: `GET/POST/PUT/DELETE /api/accounts`
  - İşlemler (Gelir/Gider): `GET/POST /api/accounts/:accountId/transactions`, `DELETE /api/accounts/:accountId/transactions/:transactionId`

Not: Çoğu uç şu an genel erişime açıktır. Üretim için JWT kimlik doğrulama ve rol/izin kontrolü (RBAC) middleware katmanı eklemeniz önerilir.

## Modeller (özet)
- `User`: kullanıcı, rol, parola özeti
- `Product`: stok, fiyat, birim, kategori
- `Category`: isim, durum
- `Store`: mağaza bilgileri
- `Shipment`: mağazalar arası sevkiyat, kalemler, durum
- `StockMovement`: giriş/çıkış hareketleri (route mevcut)
- `Account`: cari kart
- `AccountTransaction`: gelir/gider işlemleri

## Geliştirme İpuçları
- Nodemon ile otomatik yeniden başlatma için `npm run dev` kullanın.
- Örnek kullanıcı oluşturma/sıfırlama: `npm run reset:users`
- Hata ayıklamada daha ayrıntılı çıktılar için `NODE_ENV=development` tutun.

## Dağıtım
- `NODE_ENV=production` ile çalıştırın.
- Ters proxy (NGINX/Caddy) arkasında servis edin.
- Güvenlik başlıkları için `helmet` ayarlarını üretimde sıkılaştırın (CSP varsayılan devre dışı).
- CORS’u izin verilen origin’lerle sınırlandırın.

