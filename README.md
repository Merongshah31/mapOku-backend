# 🗺️ Mapoku Backend API

Accessible routing API for Mapoku — helps users with disabilities navigate safely by crowdsourcing real-world obstacles.

**Stack**: Node.js · Express · Supabase (PostgreSQL + PostGIS) · OpenRouteService · Vercel

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
# Fill in OPENWEATHER_API_KEY in .env for weather support
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

### 5. Interactive API Documentation
Open [http://localhost:3000/api-docs](http://localhost:3000/api-docs) in a browser to explore and test the OpenAPI 3.0 API.

For a deployed environment, set `API_BASE_URL` to the public API URL so Swagger UI sends requests to the correct server.

### Deploy to Vercel

The project uses [api/index.js](api/index.js) as the Vercel serverless entrypoint. Vercel routes all requests to the Express app, including `/health`, `/api-docs`, and `/api/v1/*`.

1. Push the repository to GitHub and import it in Vercel, or run `vercel` from the project directory.
2. In **Project Settings → Environment Variables**, add the values from `.env.example` for the `Production`, `Preview`, and `Development` environments as needed.
3. Required server-side variables are `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ORS_API_KEY`, and `OPENWEATHER_API_KEY`. Never commit `.env` or paste these secrets into `vercel.json`.
4. Set `API_BASE_URL` to the deployed URL, for example `https://your-project.vercel.app`.
5. After deployment, verify:

```bash
curl https://your-project.vercel.app/health
curl "https://your-project.vercel.app/api/v1/weather/current?lat=3.139&lon=101.686"
curl "https://your-project.vercel.app/api/v1/routes/accessible?startLat=3.139&startLng=101.686&endLat=3.147&endLng=101.695&accessibilityNeeds=wheelchair"
```

Vercel runs the backend as serverless functions. Supabase Realtime remains responsible for frontend realtime updates; no persistent Node process or local `.osm.pbf`/Docker routing engine is required for this deployment.

---

## 📡 API Reference

Base URL (local): `http://localhost:3000`  
Base URL (team / tunnel): `https://ticket-micro-fair-likelihood.trycloudflare.com`  
Base URL (prod): `https://your-app.vercel.app`

> **For teammates**: Use the **tunnel URL** above — it exposes the host machine's local server via Cloudflare. No setup needed, just send requests to that URL directly.

---

### 🔓 Temporary Authentication Mode

Bearer JWT checks are temporarily disabled for obstacle reporting and voting. The register/login endpoints remain available, while `/api/v1/users/me` is unavailable until authentication is enabled again.

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
  # Temporarily unavailable while authentication is disabled
```

### 📊 Reporting Endpoints

#### Get My Obstacle Reports
```bash
curl "http://localhost:3000/api/v1/reports/me?page=1&limit=20&status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Returns the authenticated user's obstacle reports, grouped status totals, and pagination metadata. `status` is optional and can be `active`, `archived`, or `under_review`.

---

### 🌦️ Weather Endpoint

Get current weather for a map coordinate. This endpoint is public; the OpenWeatherMap key stays on the backend.

```bash
curl "http://localhost:3000/api/v1/weather/current?lat=3.139&lon=101.686"
```

Configure these values in `.env`:

```env
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
OPENWEATHER_API_KEY=your-openweathermap-api-key-here
OPENWEATHER_UNITS=metric
OPENWEATHER_LANG=ms
OPENWEATHER_TIMEOUT_MS=10000
```

The endpoint returns current conditions, temperature, humidity, wind, visibility, and observation time. It returns `400` for invalid coordinates and `502` when OpenWeatherMap is unavailable or rejects the key.

---

### 🛣️ Routing Endpoints

#### Get Accessible Route
```bash
curl "http://localhost:3000/api/v1/routes/accessible?startLat=3.139&startLng=101.686&endLat=3.147&endLng=101.695&accessibilityNeeds=wheelchair,elderly"
```

#https://ticket-micro-fair-likelihood.trycloudflare.com/api/v1/routes/accessible?startLat=3.139&startLng=101.686&endLat=3.147&endLng=101.695&accessibilityNeeds=wheelchair,elderly"


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
  # Voting still requires a user identity in the database
```

#### Report Obstacle as Cleared ("It's gone!")
```bash
curl -X PUT http://localhost:3000/api/v1/obstacles/OBSTACLE_UUID/downvote \
  # Voting still requires a user identity in the database
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
│   │   └── ors.js                  # OpenRouteService axios client
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
│   │   ├── routing.service.js      # ORS + obstacle-aware routing
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
