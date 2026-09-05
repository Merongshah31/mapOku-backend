# 🗺️ Dokumentasi Lengkap Endpoint Peta & Aliran Laluan Aksesibel (Mapoku)

Dokumen ini memperincikan seni bina penuh, spesifikasi endpoint API, dan aliran kerja 5 fasa dari pemilihan titik permulaan (Point A) hingga ke lukisan garisan laluan (Polyline) di atas peta React-Leaflet.

---

## 📑 Isi Kandungan
1. [Seni Bina Sistem (System Architecture)](#1-seni-bina-sistem)
2. [Aliran 5 Fasa (End-to-End Flow)](#2-aliran-5-fasa-end-to-end-flow)
   - [Fasa 1: Permintaan Laluan (Frontend)](#fasa-1-permintaan-laluan-frontend)
   - [Fasa 2: Pengesanan Halangan Dinamik (Backend & Database)](#fasa-2-pengesanan-halangan-dinamik-backend--database)
   - [Fasa 3: Suntikan Arahan Laluan (Backend ke Engine)](#fasa-3-suntikan-arahan-laluan-backend-ke-engine)
   - [Fasa 4: Pengiraan Pemetaan (Routing Engine)](#fasa-4-pengiraan-pemetaan-routing-engine)
   - [Fasa 5: Penyahkodan & Paparan Visual (Frontend)](#fasa-5-penyahkodan--paparan-visual-frontend)
3. [Spesifikasi Penuh Endpoint API](#3-spesifikasi-penuh-endpoint-api)
   - [A. GET /api/v1/routes/accessible](#a-get-apiv1routesaccessible)
   - [B. GET /api/v1/obstacles](#b-get-apiv1obstacles)
   - [C. POST /api/v1/obstacles](#c-post-apiv1obstacles)
   - [D. PUT /api/v1/obstacles/:id/upvote & downvote](#d-put-apiv1obstaclesidupvote--downvote)
4. [Panduan Koordinat: Perangkap GeoJSON vs Leaflet](#4-panduan-koordinat-perangkap-geojson-vs-leaflet)
5. [Contoh Kod Integrasi Frontend (React + Leaflet)](#5-contoh-kod-integrasi-frontend-react--leaflet)

---

## 1. Seni Bina Sistem

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND (React + Leaflet)                          │
│                                                                                 │
│  [User Click Point A] ──> [User Click Point B] ──> Pilih Profil OKU (Wheelchair) │
│           │                                                    │                │
│           ▼                                                    ▼                │
│     Leaflet Markers                                      Fetch Route            │
└───────────┬────────────────────────────────────────────────────┬────────────────┘
            │                                                    │
            │ HTTP GET                                           │ HTTP GET
            ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND (Node.js / Express)                         │
│                                                                                 │
│  /api/v1/obstacles?minLat=..                                /api/v1/routes/     │
│           │                                                 accessible          │
│           │                                                    │                │
│           ▼                                                    ▼                │
│    [PostGIS BBox Query]                             1. Kira Bounding Box / Koridor│
│           │                                         2. Tarik Halangan Aktif DB   │
│           │                                         3. Bina Waypoint Mengelak   │
└───────────┼────────────────────────────────────────────────────┬────────────────┘
            │                                                    │
            ▼                                                    ▼
┌─────────────────────────┐                            ┌──────────────────────────┐
│   SUPABASE (PostgreSQL) │                            │ ROUTING ENGINE           │
│   + PostGIS Extensions  │                            │ (OSRM / GraphHopper)     │
│                         │                            │                          │
│  Table: obstacles       │                            │  OSM Street Network Data │
│  RPC: get_obstacles_    │                            │  Avoidance Calculation   │
│       near_points       │                            │  GeoJSON Polyline Output │
└─────────────────────────┘                            └──────────────┬───────────┘
                                                                      │
                                                                      ▼
                                                                Return GeoJSON
                                                                      │
                                                             [Frontend Flip Coords]
                                                                      │
                                                                      ▼
                                                             <Polyline> Leaflet
```

---

## 2. Aliran 5 Fasa (End-to-End Flow)

### Fasa 1: Permintaan Laluan (Frontend)
1. **Input Pengguna**: Pengguna menekan mod *"Pilih Titik"* pada UI.
   - Klik pertama pada peta menetapkan **Titik Mula (Point A)**: lat: `3.1390`, lng: `101.6863` (KL Sentral).
   - Klik kedua menetapkan **Destinasi (Point B)**: lat: `3.1474`, lng: `101.6929` (Dataran Merdeka).
   - Pengguna memilih profil aksesibiliti: contohnya `wheelchair` (kerusi roda) atau `visually_impaired`.
2. **Hantar Request**: Frontend menghantar permintaan HTTP `GET` ke pelayan Node.js:
   ```http
   GET /api/v1/routes/accessible?startLat=3.1390&startLng=101.6863&endLat=3.1474&endLng=101.6929&accessibilityNeeds=wheelchair
   ```

---

### Fasa 2: Pengesanan Halangan Dinamik (Backend & Database)
3. **Kira Radius Peta / Koridor**: 
   - Node.js menerima koordinat A dan B.
   - Node.js memanggil stored procedure PostGIS `get_obstacles_near_points` dengan koridor buffer 100 meter antara garisan lurus A dan B.
4. **Query Database (Supabase + PostGIS)**:
   - Database mencari halangan aktif (`status = 'active'`) yang menjejaskan profil `wheelchair`.
   - Halangan yang tidak relevan (cth: lampu audio rosak yang hanya menjejaskan pendengaran) ditapis keluar jika pengguna hanya memilih kerusi roda.

---

### Fasa 3: Suntikan Arahan Laluan (Backend ke Engine)
5. **Bina Payload / Waypoints**:
   - Backend mengenal pasti koordinat halangan yang dikesan di atas laluan (cth: ramp rosak di `[101.6890, 3.1420]`).
   - Backend membina titik lencongan (*perpendicular offset detour point*) sejauh ~30 meter ke sisi halangan supaya laluan melencong keluar daripada zon bahaya.
6. **Suntik Parameter Enjin**:
   - Profil disetkan kepada pejalan kaki/kerusi roda (`foot` atau profil khas).
   - Waypoints disusun: `Point A` ➔ `Detour 1` ➔ `Detour 2` ➔ `Point B`.
7. **Hantar ke Engine**:
   - Backend memanggil enjin pemetaan OSRM / GraphHopper melalui HTTP request.

---

### Fasa 4: Pengiraan Pemetaan (Routing Engine)
8. **Analisis Graf OSM**:
   - Enjin memproses laluan berpandukan peta asas OpenStreetMap (`.osm.pbf`).
9. **Kira & Elak**:
   - Enjin mencari graf jalan optimum untuk pejalan kaki/kerusi roda, sambil memaksa laluan melalui waypoints lencongan yang telah disuntik oleh Node.js, sekali gus mengelakkan halangan secara tepat.
10. **Output GeoJSON**:
    - Enjin memulangkan senarai koordinat laluan (`LineString`) bersama maklumat jarak (`distance_meters`) dan anggaran masa (`duration_seconds`).

---

### Fasa 5: Penyahkodan & Paparan Visual (Frontend)
11. **Terima Respons**:
    - Node.js membalas ke React dengan format GeoJSON FeatureCollection piawai.
12. **Penyelarasan Koordinat (Coordinate Flip)**:
    - GeoJSON piawai memulangkan koordinat format `[longitude, latitude]`.
    - Leaflet.js memerlukan format sebaliknya: `[latitude, longitude]`.
    - Frontend menukar array:
      ```javascript
      const leafletCoords = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      ```
13. **Lukis Peta**:
    - React memasukkan koordinat yang telah ditukar ke komponen `<Polyline>`:
      ```jsx
      <Polyline positions={leafletCoords} color="#2563eb" weight={5} opacity={0.8} />
      ```
    - Garisan biru bersinar (polyline) terus dilukis di atas peta merentasi Point A ke Point B dengan mengelak semua halangan!

---

## 3. Spesifikasi Penuh Endpoint API

Base URL yang disokong:
- **Local Dev**: `http://localhost:3000`
- **Cloudflare Tunnel (Team)**: `https://ticket-micro-fair-likelihood.trycloudflare.com`

---

### A. GET `/api/v1/routes/accessible`
Mengira laluan pejalan kaki paling selamat & aksesibel dengan mengelak halangan yang dilaporkan komuniti.

#### Parameter Query:
| Parameter | Jenis | Wajib? | Contoh | Keterangan |
|---|---|---|---|---|
| `startLat` | Float | **Ya** | `3.1390` | Latitud titik permulaan (Point A) |
| `startLng` | Float | **Ya** | `101.6863` | Longitud titik permulaan (Point A) |
| `endLat` | Float | **Ya** | `3.1474` | Latitud destinasi (Point B) |
| `endLng` | Float | **Ya** | `101.6929` | Longitud destinasi (Point B) |
| `accessibilityNeeds` | String | Tidak | `wheelchair,elderly` | Pilihan: `wheelchair`, `visually_impaired`, `elderly`, `stroller`, `hearing_impaired` |

#### Contoh Request cURL:
```bash
curl "http://localhost:3000/api/v1/routes/accessible?startLat=3.1390&startLng=101.6863&endLat=3.1474&endLng=101.6929&accessibilityNeeds=wheelchair"
```

#### Contoh Response (200 OK):
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
            [101.6871, 3.1405],
            [101.6885, 3.1422],
            [101.6910, 3.1450],
            [101.6929, 3.1474]
          ]
        },
        "properties": {
          "distance_meters": 1420.5,
          "duration_seconds": 1022.0,
          "accessibility_needs": ["wheelchair"],
          "obstacles_avoided": 2,
          "waypoints_count": 4
        }
      }
    ],
    "metadata": {
      "obstacles_on_route": [
        {
          "id": "c8b417e0-9943-41c9-a038-f94d9302633d",
          "type": "broken_pavement",
          "latitude": 3.1415,
          "longitude": 101.6880
        }
      ]
    }
  }
}
```

---

### B. GET `/api/v1/obstacles`
Menarik semua pin halangan aktif di dalam kawasan skrin peta semasa (Bounding Box).

#### Parameter Query:
| Parameter | Jenis | Wajib? | Contoh | Keterangan |
|---|---|---|---|---|
| `minLat` | Float | **Ya** | `3.1000` | Sudut bawah latitud |
| `minLng` | Float | **Ya** | `101.6500` | Sudut kiri longitud |
| `maxLat` | Float | **Ya** | `3.1800` | Sudut atas latitud |
| `maxLng` | Float | **Ya** | `101.7500` | Sudut kanan longitud |

#### Contoh Request cURL:
```bash
curl "http://localhost:3000/api/v1/obstacles?minLat=3.12&minLng=101.67&maxLat=3.17&maxLng=101.73"
```

#### Contoh Response (200 OK):
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "latitude": 3.1585,
      "longitude": 101.7130,
      "type": "broken_pavement",
      "description": "Jalan pejalan kaki rosak berdekatan KLCC. Bahaya untuk kerusi roda.",
      "image_url": "https://images.unsplash.com/photo-1584463699039-38c644837517",
      "status": "active",
      "upvotes": 5,
      "downvotes": 0,
      "affects": ["wheelchair", "stroller", "elderly"],
      "created_at": "2026-09-05T08:56:37.123Z"
    }
  ]
}
```

---

### C. POST `/api/v1/obstacles`
Melaporkan halangan baru (Crowdsourcing) bersama gambar pilihan. Menghantar notifikasi masa nyata ke peta pengguna lain melalui Supabase Realtime secara automatik.

- **Headers**: `Authorization: Bearer <access_token>`
- **Content-Type**: `multipart/form-data`

#### Fields Body:
| Field | Jenis | Wajib? | Keterangan |
|---|---|---|---|
| `latitude` | Float | **Ya** | Latitud lokasi halangan |
| `longitude` | Float | **Ya** | Longitud lokasi halangan |
| `type` | String | **Ya** | Jenis halangan (rujuk senarai di bawah) |
| `description` | String | Tidak | Keterangan ringkas situasi halangan |
| `affects` | String / JSON | Tidak | Contoh: `["wheelchair","elderly"]` |
| `image` | File | Tidak | Fail gambar (JPEG/PNG/WebP, maks 5MB) |

**Senarai Nilai `type` yang Dibenarkan:**
`broken_pavement`, `steep_ramp`, `missing_curb_cut`, `construction`, `flooded_path`, `narrow_passage`, `no_tactile_paving`, `blocked_ramp`, `uneven_surface`, `other`

---

### D. PUT `/api/v1/obstacles/:id/upvote` & `downvote`
Sistem pengesahan komuniti (seperti Waze):
- `upvote`: Mengesahkan halangan masih wujud (+1 reputasi).
- `downvote`: Melaporkan halangan sudah tiada / telah dibaiki. **Jika mencapai 3 downvotes**, status halangan bertukar secara automatik kepada `archived` dan hilang dari peta.

---

## 4. Panduan Koordinat: Perangkap GeoJSON vs Leaflet

> [!WARNING]
> **PUNCA UTAMA GARISAN TIDAK MUNCUL DI PETA:**
> - Enjin OSRM & GeoJSON mengeluarkan format: `[longitude, latitude]` (X, Y mengikut standard kartografi matematik).
> - Komponen Peta Leaflet (`L.latLng` / `<Polyline>`) memerlukan format: `[latitude, longitude]` (Y, X mengikut standard GPS).

Jika koordinat tidak diterbalikkan (*flipped*), Leaflet akan cuba melukis garisan di kawasan Lautan Hindi berdekatan Antartika (`lat: 101.68, lng: 3.14`), menyebabkan polyline tidak kelihatan!

### Formula Penukaran (Wajib Dipakai di Frontend):
```javascript
// Data mentah dari backend:
const geojsonCoords = result.data.features[0].geometry.coordinates;
// Contoh: [[101.6863, 3.1390], [101.6871, 3.1405], ...]

// Balikkan koordinat untuk Leaflet:
const leafletPolyline = geojsonCoords.map(([lng, lat]) => [lat, lng]);
// Hasil: [[3.1390, 101.6863], [3.1405, 101.6871], ...]
```

---

## 5. Contoh Kod Integrasi Frontend (React + Leaflet)

Berikut adalah contoh lengkap komponen React yang mengendalikan pemilihan Point A, Point B, memanggil API backend, dan melukis garisan polyline:

```jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const API_BASE = 'http://localhost:3000'; // atau Cloudflare Tunnel URL

// Komponen untuk menangkap klik tetikus atas peta
function ClickPicker({ onSelectPoint, activePoint }) {
  useMapEvents({
    click(e) {
      if (activePoint) {
        onSelectPoint(activePoint, [e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function AccessibleRouteMap() {
  const [pointA, setPointA] = useState(null); // [lat, lng]
  const [pointB, setPointB] = useState(null); // [lat, lng]
  const [activePicking, setActivePicking] = useState(null); // 'A' | 'B' | null
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPoint = (type, coords) => {
    if (type === 'A') {
      setPointA(coords);
      setActivePicking('B'); // Automatik minta klik B seterusnya
    } else {
      setPointB(coords);
      setActivePicking(null);
    }
  };

  const calculateRoute = async () => {
    if (!pointA || !pointB) return;
    setLoading(true);

    try {
      const url = `${API_BASE}/api/v1/routes/accessible?startLat=${pointA[0]}&startLng=${pointA[1]}&endLat=${pointB[0]}&endLng=${pointB[1]}&accessibilityNeeds=wheelchair`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data.features.length > 0) {
        const feature = json.data.features[0];
        
        // ⚠️ FASA 5: Flip [lng, lat] -> [lat, lng] untuk Leaflet
        const leafCoords = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        
        setRouteCoordinates(leafCoords);
        setRouteInfo(feature.properties);
      }
    } catch (err) {
      console.error('Gagal mendapatkan laluan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Panel Kawalan Floating */}
      <div style={{
        position: 'absolute', top: 20, right: 20, zIndex: 1000,
        background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h3>🧭 Navigasi Aksesibel OKU</h3>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button 
            onClick={() => setActivePicking('A')}
            style={{ background: activePicking === 'A' ? '#16a34a' : '#e5e7eb', color: activePicking === 'A' ? 'white' : 'black' }}>
            {pointA ? '✓ Titik A Diset' : '📍 Set Titik A'}
          </button>
          <button 
            onClick={() => setActivePicking('B')}
            style={{ background: activePicking === 'B' ? '#dc2626' : '#e5e7eb', color: activePicking === 'B' ? 'white' : 'black' }}>
            {pointB ? '✓ Titik B Diset' : '🏁 Set Titik B'}
          </button>
        </div>

        {activePicking && (
          <p style={{ color: '#2563eb', fontSize: 13 }}>
            Sila klik atas peta untuk menetapkan <strong>Titik {activePicking}</strong>...
          </p>
        )}

        <button 
          onClick={calculateRoute} 
          disabled={!pointA || !pointB || loading}
          style={{ width: '100%', padding: 10, background: '#2563eb', color: 'white', borderRadius: 6, fontWeight: 'bold' }}>
          {loading ? 'Mengira Laluan...' : 'Jana Laluan Aksesibel'}
        </button>

        {routeInfo && (
          <div style={{ marginTop: 12, fontSize: 13, borderTop: '1px solid #eee', paddingTop: 8 }}>
            <p>📏 <strong>Jarak:</strong> {(routeInfo.distance_meters / 1000).toFixed(2)} km</p>
            <p>⏱️ <strong>Masa:</strong> {Math.ceil(routeInfo.duration_seconds / 60)} minit</p>
            <p>🛡️ <strong>Halangan Dielak:</strong> {routeInfo.obstacles_avoided}</p>
          </div>
        )}
      </div>

      {/* Paparan Peta Leaflet */}
      <MapContainer center={[3.145, 101.695]} zoom={14} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickPicker onSelectPoint={handleSelectPoint} activePoint={activePicking} />

        {/* Marker Point A & B */}
        {pointA && <Marker position={pointA} />}
        {pointB && <Marker position={pointB} />}

        {/* Garisan Polyline Laluan */}
        {routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.85 }} 
          />
        )}
      </MapContainer>
    </div>
  );
}
```
