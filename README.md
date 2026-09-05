# 🗺️ Mapoku Backend API

Accessible routing API for Mapoku — helps users with disabilities navigate safely by crowdsourcing real-world obstacles.

**Stack**: Node.js · Express · Supabase (PostgreSQL + PostGIS) · OSRM · Vercel

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd mapoku-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in your Supabase credentials (see below)
```

### 3. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` public key → `SUPABASE_ANON_KEY`
3. Go to **SQL Editor** and run both migration files:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rpc_functions.sql`
4. Go to **Storage** and create a bucket named `obstacle-images` (set to **Public**)
5. Go to **Realtime** and enable the `obstacles` table

### 4. Run Locally
```bash
npm run dev
# Server starts at http://localhost:3000
```

---

## 📡 API Reference

Base URL (local): `http://localhost:3000`  
Base URL (team / tunnel): `https://ticket-micro-fair-likelihood.trycloudflare.com`  
Base URL (prod): `https://your-app.vercel.app`

> **For teammates**: Use the **tunnel URL** above — it exposes the host machine's local server via Cloudflare. No setup needed, just send requests to that URL directly.

---

### 🔐 Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```
Get your token from `POST /api/v1/users/login`.

---

### 👤 User Endpoints

#### Register
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "mapoku_user"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```
Returns `access_token` — use this in all subsequent authenticated requests.

#### Get My Profile
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 🛣️ Routing Endpoints

#### Get Accessible Route
```bash
curl "http://localhost:3000/api/v1/routes/accessible?startLat=3.139&startLng=101.686&endLat=3.147&endLng=101.695&accessibilityNeeds=wheelchair,elderly"
```

**Query Parameters:**

| Param | Required | Description |
|---|---|---|
| `startLat` | ✅ | Origin latitude (-90 to 90) |
| `startLng` | ✅ | Origin longitude (-180 to 180) |
| `endLat` | ✅ | Destination latitude |
| `endLng` | ✅ | Destination longitude |
| `accessibilityNeeds` | ❌ | Comma-separated: `wheelchair`, `visually_impaired`, `elderly`, `stroller`, `hearing_impaired` |

**Response:** GeoJSON FeatureCollection with route polyline, distance, duration, and obstacles avoided.

---

### 🚧 Obstacle Endpoints

#### Get Obstacles in Map View (Bounding Box)
```bash
curl "http://localhost:3000/api/v1/obstacles?minLat=3.13&minLng=101.68&maxLat=3.15&maxLng=101.70"
```

#### Report an Obstacle (with image)
```bash
curl -X POST http://localhost:3000/api/v1/obstacles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "latitude=3.141" \
  -F "longitude=101.688" \
  -F "type=broken_pavement" \
  -F "description=Large crack on the sidewalk, dangerous for wheelchairs" \
  -F 'affects=["wheelchair","stroller"]' \
  -F "image=@/path/to/photo.jpg"
```

**Obstacle types:** `broken_pavement`, `steep_ramp`, `missing_curb_cut`, `construction`, `flooded_path`, `narrow_passage`, `no_tactile_paving`, `blocked_ramp`, `uneven_surface`, `other`

#### Confirm Obstacle ("Still there?")
```bash
curl -X PUT http://localhost:3000/api/v1/obstacles/OBSTACLE_UUID/upvote \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Report Obstacle as Cleared ("It's gone!")
```bash
curl -X PUT http://localhost:3000/api/v1/obstacles/OBSTACLE_UUID/downvote \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
> Auto-archives obstacle after **3 downvotes**.

---

### ❤️ Health Check
```bash
curl http://localhost:3000/health
```

---

## 🏗️ Project Structure

```
mapoku-backend/
├── api/
│   └── index.js                    # Vercel serverless entry point
├── src/
│   ├── app.js                      # Express app factory
│   ├── server.js                   # Local dev server
│   ├── config/
│   │   ├── supabase.js             # Supabase admin client
│   │   └── osrm.js                 # OSRM axios client
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   ├── validate.js             # express-validator runner
│   │   └── errorHandler.js         # Global error + 404 handler
│   ├── routes/
│   │   ├── routes.routes.js        # /api/v1/routes
│   │   ├── obstacles.routes.js     # /api/v1/obstacles
│   │   └── users.routes.js         # /api/v1/users
│   ├── controllers/
│   │   ├── routes.controller.js
│   │   ├── obstacles.controller.js
│   │   └── users.controller.js
│   ├── services/
│   │   ├── routing.service.js      # OSRM + obstacle-aware routing
│   │   ├── obstacle.service.js     # PostGIS bounding box + create
│   │   ├── reputation.service.js   # Voting + auto-archive logic
│   │   └── storage.service.js      # Supabase Storage uploads
│   └── validators/
│       ├── obstacle.validator.js
│       └── route.validator.js
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Tables, RLS, triggers
│       └── 002_rpc_functions.sql   # PostGIS stored procedures
├── .env.example
├── vercel.json
└── package.json
```

---

## 🌐 Supabase Realtime (Frontend Setup)

The backend writes to Supabase — Realtime broadcasts changes automatically.
In your Leaflet.js frontend, subscribe like this:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to new obstacles in real time
const channel = supabase
  .channel('obstacles-live')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'obstacles' },
    (payload) => {
      const obstacle = payload.new;
      // Add new obstacle pin to your Leaflet map
      addObstacleMarker(obstacle);
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'obstacles' },
    (payload) => {
      const obstacle = payload.new;
      if (obstacle.status === 'archived') {
        removeObstacleMarker(obstacle.id); // Remove cleared obstacle
      }
    }
  )
  .subscribe();
```

---

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Set environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `DOWNVOTE_ARCHIVE_THRESHOLD`
- `NODE_ENV=production`

---

## 📋 License
MIT — Mapoku Team
