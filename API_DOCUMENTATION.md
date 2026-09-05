# 🚀 Dokumentasi Penuh Backend API (Mapoku)

Dokumentasi rasmi dan panduan lengkap untuk penggunaan semua endpoint REST API pada pelayan backend **Mapoku**.

---

## 🌐 Base URL & Persekitaran

| Persekitaran | Base URL | Catatan |
|---|---|---|
| **Localhost** | `http://localhost:3000` | Untuk pembangunan tempatan |
| **Cloudflare Tunnel** | `https://ticket-micro-fair-likelihood.trycloudflare.com` | Akses kawan / testing remote tanpa port-forward |
| **Production (Vercel)** | `https://<app-name>.vercel.app` | Penggunaan awam bila dideploy |

---

## 📚 Dokumentasi Interaktif Swagger

API menggunakan standard OpenAPI 3.0 dan menyediakan Swagger UI untuk meneroka serta menguji endpoint secara interaktif.

### Akses Swagger UI

| Persekitaran | URL Dokumentasi |
|---|---|
| **Localhost** | [http://localhost:3000/api-docs](http://localhost:3000/api-docs) |
| **Cloudflare Tunnel** | `https://<tunnel-url>/api-docs` |
| **Production (Vercel)** | `https://<app-name>.vercel.app/api-docs` |

Jalankan server secara tempatan, kemudian buka:

```bash
npm run dev
```

Swagger UI menyediakan:

- Summary dan description setiap endpoint
- Query, path, dan multipart form parameters
- Contoh request body dan response
- HTTP status codes
- Butang **Try it out** untuk menguji endpoint
- Maklumat mod authentication semasa

Untuk deployment, tetapkan `API_BASE_URL` kepada URL awam API supaya Swagger UI menggunakan server yang betul.

---

## 🔓 Mod Authentication Sementara

Semakan Bearer JWT sedang dinyahaktifkan sementara untuk pelaporan halangan. Endpoint voting masih memerlukan identiti pengguna kerana jadual database `votes` mewajibkan `user_id`, manakala `/api/v1/users/me` tidak tersedia dalam mod ini.

---

## 🌐 Supabase Realtime untuk Peta

Vercel hanya menjalankan backend sebagai serverless HTTP function. Ia tidak menyediakan WebSocket atau Socket.IO yang persistent. Untuk kemas kini marker secara langsung, frontend perlu:

1. Memuatkan obstacle awal melalui `GET /api/v1/obstacles` berdasarkan bounding box.
2. Subscribe kepada table `public.obstacle_realtime_events` menggunakan `SUPABASE_ANON_KEY`.
3. Menambah atau mengemas kini marker apabila `status` ialah `active`.
4. Membuang marker apabila `status` bukan `active` atau `event_type` ialah `delete`.
5. Membuat semula request bounding box selepas reconnect atau channel error kerana Realtime tidak replay event yang terlepas.

Projection ini hanya mengandungi data map yang selamat untuk dibaca public. `SUPABASE_SERVICE_ROLE_KEY` mesti kekal di backend/Vercel dan tidak boleh dihantar ke frontend.

---

## 📋 Senarai Semua Endpoint

| Kategori | Method | Endpoint Path | Auth? | Fungsi Ringkas |
|---|---|---|:---:|---|
| **Health** | `GET` | `/health` | ❌ | Periksa status hidup server |
| **Weather** | `GET` | `/api/v1/weather/current` | ❌ | Dapatkan cuaca semasa berdasarkan koordinat |
| **AI** | `POST` | `/api/v1/ai/validate-image` | ❌ | Semak imej obstacle melalui backend Vertex AI |
| **Moderation** | `PATCH` | `/api/v1/moderation/obstacles/:id` | 🔐 | Approve atau reject laporan under review |
| **Reports** | `GET` | `/api/v1/reports/me` | ✅ | Senarai laporan halangan milik pengguna yang sedang log masuk |
| **Dokumentasi** | `GET` | `/api-docs` | ❌ | Swagger UI interaktif OpenAPI 3.0 |
| **Auth/User** | `POST` | `/api/v1/users/register` | ❌ | Daftar akaun pengguna baru |
| **Auth/User** | `POST` | `/api/v1/users/login` | ❌ | Log masuk & terima JWT token |
| **Auth/User** | `GET` | `/api/v1/users/me` | ❌ | Tidak tersedia sementara authentication dinyahaktifkan |
| **Routing** | `GET` | `/api/v1/routes/accessible` | ❌ | Kira laluan aksesibel elak halangan |
| **Obstacles** | `GET` | `/api/v1/obstacles` | ❌ | Dapatkan senarai halangan (Bounding Box) |
| **Obstacles** | `POST` | `/api/v1/obstacles` | ❌ | Laporkan halangan baru (+ upload gambar) |
| **Reputasi** | `PUT` | `/api/v1/obstacles/:id/upvote` | ❌* | Sahkan halangan masih wujud (+1) |
| **Reputasi** | `PUT` | `/api/v1/obstacles/:id/downvote` | ❌* | Lapor halangan telah tiada / dibaiki (-1) |

---

## 1. 🏥 Health Check

### `GET /health`
Semak sama ada perkhidmatan API sedang berjalan dengan lancar.

- **Request:**
  ```bash
  curl http://localhost:3000/health
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-05T09:20:00.000Z",
    "uptime": 2450.32
  }
  ```

---

## 2. 👤 Pengguna & Pengesahan (Users & Auth)

### `POST /api/v1/users/register`
Mendaftar akaun pengguna baru menggunakan Supabase Auth.

- **Headers:** `Content-Type: application/json`
- **Body JSON:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "username": "ali_wheelchair"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "a9c1e7a4-850f-4882-9659-19ffce3d7dc2",
        "email": "user@example.com"
      },
      "profile": {
        "id": "a9c1e7a4-850f-4882-9659-19ffce3d7dc2",
        "username": "ali_wheelchair",
        "reputation_score": 0
      },
      "session": {
        "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
        "token_type": "bearer",
        "expires_in": 3600
      }
    }
  }
  ```

---

### `POST /api/v1/users/login`
Log masuk pengguna untuk mendapatkan access token.

- **Headers:** `Content-Type: application/json`
- **Body JSON:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "a9c1e7a4-850f-4882-9659-19ffce3d7dc2",
        "email": "user@example.com"
      },
      "profile": {
        "id": "a9c1e7a4-850f-4882-9659-19ffce3d7dc2",
        "username": "ali_wheelchair",
        "reputation_score": 5
      },
      "session": {
        "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
        "token_type": "bearer",
        "expires_in": 3600
      }
    }
  }
  ```

---

### `GET /api/v1/users/me`
Mendapatkan maklumat profil pengguna semasa berpandukan token.

- **Nota:** Tidak tersedia sementara authentication dinyahaktifkan.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "a9c1e7a4-850f-4882-9659-19ffce3d7dc2",
      "username": "ali_wheelchair",
      "reputation_score": 5,
      "created_at": "2026-09-05T08:00:00.000Z"
    }
  }
  ```

---

## 3. 🌦️ Cuaca Semasa (OpenWeatherMap)

### `GET /api/v1/weather/current`
Mendapatkan keadaan cuaca semasa berdasarkan koordinat lokasi. Endpoint ini tidak memerlukan token pengguna; backend menggunakan API key OpenWeatherMap secara server-side.

#### Parameter Query:
| Parameter | Jenis | Wajib? | Contoh | Keterangan |
|---|---|:---:|---:|---|
| `lat` | Float | **Ya** | `3.1390` | Latitud antara `-90` hingga `90` |
| `lon` | Float | **Ya** | `101.6863` | Longitud antara `-180` hingga `180` |

- **Contoh Request:**
  ```bash
  curl "http://localhost:3000/api/v1/weather/current?lat=3.1390&lon=101.6863"
  ```

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "location": {
        "name": "Kuala Lumpur",
        "country": "MY",
        "latitude": 3.139,
        "longitude": 101.686
      },
      "weather": {
        "id": 800,
        "main": "Clear",
        "description": "langit cerah",
        "icon": "01d"
      },
      "temperature": {
        "current": 30.2,
        "feels_like": 34.1,
        "minimum": 29.5,
        "maximum": 31,
        "humidity": 70
      },
      "wind": {
        "speed": 2.1,
        "direction": 180
      },
      "visibility_meters": 10000,
      "observed_at": "2026-09-06T08:00:00.000Z"
    }
  }
  ```

- **Response Errors:**
  - `400 Bad Request` jika koordinat tidak sah.
  - `502 Bad Gateway` jika OpenWeatherMap tidak tersedia atau API key ditolak.

API key ditetapkan melalui `OPENWEATHER_API_KEY` dalam `.env` dan tidak dihantar kepada frontend.

---

## 4. 🧭 Navigasi & Routing (Aksesibiliti OKU)

### `GET /api/v1/routes/accessible`
Mengira laluan pejalan kaki terbaik dengan melencong mengelakkan halangan jalan raya mengikut keperluan aksesibiliti OKU.

#### Parameter Query:
| Parameter | Jenis | Wajib? | Nilai Contoh | Keterangan |
|---|---|:---:|---|---|
| `startLat` | Float | **Ya** | `3.1390` | Latitud Titik Mula (Point A) |
| `startLng` | Float | **Ya** | `101.6863` | Longitud Titik Mula (Point A) |
| `endLat` | Float | **Ya** | `3.1474` | Latitud Destinasi (Point B) |
| `endLng` | Float | **Ya** | `101.6929` | Longitud Destinasi (Point B) |
| `accessibilityNeeds` | String | Tidak | `wheelchair,elderly` | Pilihan: `wheelchair`, `visually_impaired`, `elderly`, `stroller`, `hearing_impaired` |

- **Contoh Request:**
  ```bash
  curl "http://localhost:3000/api/v1/routes/accessible?startLat=3.1390&startLng=101.6863&endLat=3.1474&endLng=101.6929&accessibilityNeeds=wheelchair"
  ```

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [101.6863, 3.1390],
              [101.6872, 3.1405],
              [101.6929, 3.1474]
            ]
          },
          "properties": {
            "distance_meters": 4085.8,
            "duration_seconds": 370.3,
            "accessibility_needs": ["wheelchair"],
            "obstacles_avoided": 1,
            "waypoints_count": 3
          }
        }
      ],
      "metadata": {
        "obstacles_on_route": [
          {
            "id": "5f1a92e3-b3c1-4b16-bc9b-38bf34710182",
            "type": "broken_pavement",
            "latitude": 3.1415,
            "longitude": 101.6880
          }
        ]
      }
    }
  }
  ```

> ⚠️ **Peringatan Format Leaflet:**  
> Array koordinat memulangkan `[longitude, latitude]`. Untuk render dalam Leaflet `<Polyline>`, balikkan susunan menjadi `[latitude, longitude]`.

---

## 4. 🚧 Pengurusan Halangan (Obstacles)

### `GET /api/v1/obstacles`
Menarik senarai halangan aktif di dalam kawasan skrin peta semasa (*Bounding Box*).

#### Parameter Query:
| Parameter | Jenis | Wajib? | Contoh | Keterangan |
|---|---|:---:|---|---|
| `minLat` | Float | **Ya** | `3.1000` | Sempadan bawah (Latitud minimum) |
| `minLng` | Float | **Ya** | `101.6500` | Sempadan kiri (Longitud minimum) |
| `maxLat` | Float | **Ya** | `3.1800` | Sempadan atas (Latitud maksimum) |
| `maxLng` | Float | **Ya** | `101.7500` | Sempadan kanan (Longitud maksimum) |

- **Contoh Request:**
  ```bash
  curl "http://localhost:3000/api/v1/obstacles?minLat=3.12&minLng=101.67&maxLat=3.17&maxLng=101.73"
  ```

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": "a1b2c3d4-0000-0000-0000-000000000001",
        "latitude": 3.1585,
        "longitude": 101.7130,
        "type": "broken_pavement",
        "description": "Laluan pejalan kaki rosak berdekatan KLCC. Sukar untuk kerusi roda.",
        "image_url": "https://.../gambar.jpg",
        "status": "active",
        "upvotes": 5,
        "downvotes": 0,
        "affects": ["wheelchair", "stroller", "elderly"],
        "created_at": "2026-09-05T08:56:37.000Z"
      }
    ]
  }
  ```

---

### `POST /api/v1/obstacles`
Melaporkan halangan fizikal baru berserta muat naik gambar wajib untuk validasi Vertex AI.

- **Headers:** `Content-Type: multipart/form-data`

#### Form Fields:
| Field | Jenis | Wajib? | Keterangan |
|---|---|:---:|---|
| `latitude` | Float | **Ya** | Latitud lokasi halangan |
| `longitude` | Float | **Ya** | Longitud lokasi halangan |
| `type` | String | **Ya** | Jenis halangan (rujuk senarai bawah) |
| `description` | String | Tidak | Maklumat terperinci keadaan halangan |
| `affects` | String / JSON | Tidak | Cth: `["wheelchair","elderly"]` |
| `image` | File | **Ya** | Fail gambar (JPG/PNG/WebP/GIF, maks 5MB) |

Gambar dianalisis secara synchronous oleh Vertex AI sebelum disimpan. Laporan yang berjaya diproses akan bermula dengan status `under_review` dan tidak dipaparkan pada map sehingga diluluskan.

#### Senarai `type` Halangan yang Sah:
- `broken_pavement` (Laluan rosak/pecah)
- `steep_ramp` (Kecerunan ramp terlalu curam)
- `missing_curb_cut` (Tiada penurun tebing / ramp turun jalan)
- `construction` (Kawasan pembinaan / halangan kerja tanah)
- `flooded_path` (Laluan bertakung air / banjir)
- `narrow_passage` (Laluan sempit terhalang tiang/gerai)
- `no_tactile_paving` (Tiada jubin taktil panduan orang buta)
- `blocked_ramp` (Ramp terhalang kenderaan/halangan)
- `uneven_surface` (Permukaan lantai tidak sekata/akar pokok)
- `other` (Lain-lain halangan)

- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Obstacle reported successfully",
    "data": {
      "id": "e3e839e2-8924-42f2-89bb-132d7211516e",
      "latitude": 3.149,
      "longitude": 101.7135,
      "type": "construction",
      "description": "Laluan pejalan kaki sempit kerana pembinaan.",
      "image_url": "https://jssylebzpkbtijnkbkbx.supabase.co/storage/v1/object/public/obstacle-images/...",
      "status": "under_review",
      "ai_validation_status": "pending",
      "ai_confidence": 0.91,
      "ai_detected_type": "construction",
      "upvotes": 0,
      "downvotes": 0,
      "affects": ["wheelchair", "elderly"]
    }
  }
  ```

---

## 5. 👍👎 Sistem Pengesahan & Reputasi (Voting)

Sistem crowdsourcing yang membolehkan pengguna mengesahkan status halangan secara komuniti:

### `PUT /api/v1/obstacles/:id/upvote`
Mengesahkan bahawa halangan masih wujud (+1 upvote).

- **Nota:** Bearer JWT tidak diperlukan sementara, tetapi voting masih memerlukan identiti pengguna pada database.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vote recorded successfully",
    "data": {
      "obstacleId": "e3e839e2-8924-42f2-89bb-132d7211516e",
      "upvotes": 6,
      "downvotes": 0,
      "status": "active"
    }
  }
  ```

---

### `PUT /api/v1/obstacles/:id/downvote`
Melaporkan bahawa halangan sudah tiada / telah dibaiki.

- **Nota:** Bearer JWT tidak diperlukan sementara, tetapi voting masih memerlukan identiti pengguna pada database.
- **Peraturan Auto-Archive:**  
  Sekiranya sesuatu halangan menerima **3 downvotes**, sistem secara automatik menukar statusnya kepada `archived`. Halangan yang berstatus `archived` tidak akan dipaparkan lagi di atas peta dan tidak akan diambil kira dalam kiraan routing.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vote recorded successfully",
    "data": {
      "obstacleId": "e3e839e2-8924-42f2-89bb-132d7211516e",
      "upvotes": 6,
      "downvotes": 3,
      "status": "archived"
    }
  }
  ```

---

## 6. Laporan Halangan Pengguna (Reports)

### `GET /api/v1/reports/me`
Mendapatkan laporan halangan yang dibuat oleh pengguna semasa, bersama ringkasan status dan maklumat pagination.

- **Authentication:** Wajib menggunakan `Authorization: Bearer <access_token>`.
- **Parameter Query:**

| Parameter | Jenis | Wajib? | Default | Keterangan |
|---|---|:---:|---:|---|
| `page` | Integer | Tidak | `1` | Nombor halaman, minimum `1` |
| `limit` | Integer | Tidak | `20` | Bilangan laporan setiap halaman, maksimum `100` |
| `status` | String | Tidak | Semua status | Pilihan: `active`, `archived`, `under_review` |

- **Contoh Request:**
  ```bash
  curl "http://localhost:3000/api/v1/reports/me?page=1&limit=20&status=active" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "active": 2,
        "archived": 1,
        "under_review": 0
      },
      "reports": [
        {
          "id": "e3e839e2-8924-42f2-89bb-132d7211516e",
          "latitude": 3.149,
          "longitude": 101.7135,
          "type": "construction",
          "description": "Laluan pejalan kaki sempit kerana pembinaan.",
          "image_url": null,
          "status": "active",
          "upvotes": 0,
          "downvotes": 0,
          "affects": ["wheelchair", "elderly"],
          "created_at": "2026-09-05T08:56:37.000Z",
          "updated_at": "2026-09-05T08:56:37.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 2,
        "total_pages": 1
      }
    }
  }
  ```

- **Response Errors:**
  - `400 Bad Request` jika `status` bukan `active`, `archived`, atau `under_review`.
  - `401 Unauthorized` jika token tiada, tidak sah, atau telah tamat tempoh.
  - `500 Server Error` jika query pangkalan data gagal.

---

## 7. ⚠️ Format Kod Ralat (Error Responses)

Semua ralat dipulangkan dalam format seragam:

```json
{
  "success": false,
  "error": {
    "message": "Keterangan ralat di sini",
    "status": 400,
    "details": []
  }
}
```

| HTTP Status | Penerangan |
|:---:|---|
| `400 Bad Request` | Parameter tidak sah atau input form gagal pengesahan validator. |
| `401 Unauthorized` | Header `Authorization` tiada atau token JWT tidak sah/tamat tempoh. |
| `404 Not Found` | ID halangan atau endpoint yang diminta tidak wujud. |
| `422 Unprocessable` | OpenRouteService tidak dapat mencari laluan atau menolak koordinat/zon halangan yang diberikan. |
| `500 Server Error` | Masalah dalaman pangkalan data atau servis luar. |
