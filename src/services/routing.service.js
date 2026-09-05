const { orsClient, ACCESSIBILITY_PROFILES } = require('../config/ors');
const supabase = require('../config/supabase');

const OBSTACLE_BUFFER_METERS = Number(process.env.OBSTACLE_BUFFER_METERS || 5);
const MAX_OBSTACLE_ZONES = Number(process.env.MAX_OBSTACLE_ZONES || 25);

/**
 * RoutingService
 * Calculates accessible pedestrian routes using OpenRouteService,
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
          !Array.isArray(obs.affects) ||
          obs.affects.length === 0 || // Affects all needs
          obs.affects.some((need) => accessibilityNeeds.includes(need))
        )
      : obstacles;

    // 3. Build ORS avoidance zones from valid obstacle coordinates.
    const obstacleZones = this._buildAvoidPolygons(relevantObstacles);
    const profile = ACCESSIBILITY_PROFILES[accessibilityNeeds[0]] || 'foot-walking';
    const requestBody = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
      options: {},
    };

    if (obstacleZones.coordinates.length > 0) {
      requestBody.options.avoid_polygons = obstacleZones;
    }

    let response;
    try {
      response = await orsClient.post(`/v2/directions/${profile}/geojson`, requestBody);
    } catch (err) {
      const error = new Error('OpenRouteService is unavailable or rejected the route request.');
      error.status = err.response?.status === 400 ? 422 : 502;
      throw error;
    }

    const feature = response.data?.features?.[0];
    const summary = feature?.properties?.summary;
    if (!feature?.geometry || !summary) {
      const error = new Error('OpenRouteService could not find a valid route for the given coordinates.');
      error.status = 422;
      throw error;
    }

    // 6. Return structured response
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            distance_meters: summary.distance,
            duration_seconds: summary.duration,
            accessibility_needs: accessibilityNeeds,
            obstacles_avoided: obstacleZones.coordinates.length,
            waypoints_count: 2,
          },
        },
      ],
      metadata: {
        obstacles_on_route: relevantObstacles.slice(0, MAX_OBSTACLE_ZONES).map((o) => ({
          id: o.id,
          type: o.type,
          latitude: o.latitude,
          longitude: o.longitude,
        })),
      },
    };
  }

  /**
   * Builds small closed polygon zones around obstacle points for ORS.
   * Coordinates are GeoJSON-standard [longitude, latitude].
   */
  _buildAvoidPolygons(obstacles) {
    const polygons = [];

    for (const obstacle of obstacles.slice(0, MAX_OBSTACLE_ZONES)) {
      const latitude = Number(obstacle.latitude);
      const longitude = Number(obstacle.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

      const halfSize = OBSTACLE_BUFFER_METERS / 2;
      const latitudeDelta = halfSize / 111320;
      const longitudeDelta = halfSize / (111320 * Math.max(Math.cos(latitude * Math.PI / 180), 0.01));
      const ring = [
        [longitude - longitudeDelta, latitude - latitudeDelta],
        [longitude + longitudeDelta, latitude - latitudeDelta],
        [longitude + longitudeDelta, latitude + latitudeDelta],
        [longitude - longitudeDelta, latitude + latitudeDelta],
        [longitude - longitudeDelta, latitude - latitudeDelta],
      ];

      polygons.push([ring]);
    }

    return {
      type: 'MultiPolygon',
      coordinates: polygons,
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

}

module.exports = new RoutingService();
