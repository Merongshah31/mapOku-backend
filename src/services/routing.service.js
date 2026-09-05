const { osrmClient, ACCESSIBILITY_PROFILES } = require('../config/osrm');
const supabase = require('../config/supabase');

/**
 * RoutingService
 * Calculates accessible pedestrian routes using OSRM,
 * dynamically avoiding user-reported obstacles.
 */
class RoutingService {
  /**
   * Calculate an accessible route between two points,
   * routing around known active obstacles.
   *
   * @param {Object} start - { lat, lng }
   * @param {Object} end   - { lat, lng }
   * @param {string[]} accessibilityNeeds - e.g. ['wheelchair', 'elderly']
   * @returns {Object} GeoJSON FeatureCollection with route + metadata
   */
  async calculatePath(start, end, accessibilityNeeds = []) {
    // 1. Fetch active obstacles near the straight-line corridor
    const obstacles = await this._getObstaclesAlongCorridor(start, end);

    // 2. Filter obstacles relevant to requested accessibility needs
    const relevantObstacles = accessibilityNeeds.length > 0
      ? obstacles.filter((obs) =>
          obs.affects.length === 0 || // Affects all needs
          obs.affects.some((need) => accessibilityNeeds.includes(need))
        )
      : obstacles;

    // 3. Build OSRM waypoints — detour around obstacles
    const waypoints = this._buildWaypoints(start, end, relevantObstacles);

    // 4. Select OSRM profile
    const profile = ACCESSIBILITY_PROFILES[accessibilityNeeds[0]] || 'foot';

    // 5. Call OSRM Route API
    const coordinateString = waypoints
      .map((w) => `${w.lng},${w.lat}`)
      .join(';');

    const response = await osrmClient.get(
      `/route/v1/${profile}/${coordinateString}`,
      {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true,
          annotations: false,
        },
      }
    );

    if (response.data.code !== 'Ok' || !response.data.routes?.length) {
      const error = new Error('OSRM could not find a valid route for the given coordinates.');
      error.status = 422;
      throw error;
    }

    const route = response.data.routes[0];

    // 6. Return structured response
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: route.geometry,
          properties: {
            distance_meters: route.distance,
            duration_seconds: route.duration,
            accessibility_needs: accessibilityNeeds,
            obstacles_avoided: relevantObstacles.length,
            waypoints_count: waypoints.length,
          },
        },
      ],
      metadata: {
        obstacles_on_route: relevantObstacles.map((o) => ({
          id: o.id,
          type: o.type,
          latitude: o.latitude,
          longitude: o.longitude,
        })),
      },
    };
  }

  /**
   * Fetches obstacles within a buffer around the straight-line corridor.
   * Uses PostGIS get_obstacles_near_points RPC.
   */
  async _getObstaclesAlongCorridor(start, end) {
    try {
      const { data, error } = await supabase.rpc('get_obstacles_near_points', {
        lats: [start.lat, end.lat],
        lngs: [start.lng, end.lng],
        buffer_meters: 100, // 100m buffer around corridor
      });

      if (error) {
        console.error('[RoutingService] RPC error:', error.message);
        return []; // Degrade gracefully — route without obstacle data
      }

      return data || [];
    } catch (err) {
      console.error('[RoutingService] Failed to fetch corridor obstacles:', err.message);
      return [];
    }
  }

  /**
   * Builds OSRM waypoints by inserting small detour points around obstacles.
   * For each obstacle, a perpendicular offset point is added to steer the route away.
   *
   * @param {Object} start
   * @param {Object} end
   * @param {Array}  obstacles
   * @returns {Array} Array of { lat, lng } waypoints
   */
  _buildWaypoints(start, end, obstacles) {
    const waypoints = [start];

    // Sort obstacles by proximity to the start point
    const sorted = [...obstacles].sort((a, b) => {
      const distA = this._haversineDistance(start, a);
      const distB = this._haversineDistance(start, b);
      return distA - distB;
    });

    for (const obstacle of sorted) {
      // Create a 30-metre perpendicular detour point
      const detour = this._perpendicularOffset(
        start,
        end,
        { lat: obstacle.latitude, lng: obstacle.longitude },
        0.0003 // ~30 metres in degrees
      );
      waypoints.push(detour);
    }

    waypoints.push(end);
    return waypoints;
  }

  /**
   * Calculates a point offset perpendicularly from the route line near an obstacle.
   */
  _perpendicularOffset(start, end, obstacle, offsetDeg) {
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // Perpendicular unit vector
    const perpX = -dy / len;
    const perpY = dx / len;

    return {
      lat: obstacle.lat + perpY * offsetDeg,
      lng: obstacle.lng + perpX * offsetDeg,
    };
  }

  /**
   * Haversine distance in metres between two lat/lng points.
   */
  _haversineDistance(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
}

module.exports = new RoutingService();
