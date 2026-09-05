jest.mock('../src/config/ors', () => ({
  orsClient: { post: jest.fn() },
  ACCESSIBILITY_PROFILES: {
    wheelchair: 'foot-walking',
    elderly: 'foot-walking',
  },
}));

jest.mock('../src/config/supabase', () => ({
  rpc: jest.fn(),
}));

const { orsClient } = require('../src/config/ors');
const supabase = require('../src/config/supabase');
const routingService = require('../src/services/routing.service');

describe('RoutingService with OpenRouteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    orsClient.post.mockResolvedValue({
      data: {
        features: [{
          geometry: {
            type: 'LineString',
            coordinates: [[101.686, 3.139], [101.695, 3.147]],
          },
          properties: { summary: { distance: 1420.5, duration: 1022 } },
        }],
      },
    });
  });

  test('builds a closed 5 metre obstacle polygon in GeoJSON order', () => {
    const result = routingService._buildAvoidPolygons([
      { latitude: 3.139, longitude: 101.686 },
    ]);
    const ring = result.coordinates[0][0];

    expect(result.type).toBe('MultiPolygon');
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[4]);
    expect(ring[0][0]).toBeCloseTo(101.686, 3);
    expect(ring[0][1]).toBeCloseTo(3.139, 3);
  });

  test('sends ORS coordinates and obstacle avoidance polygons', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{
        id: 'obstacle-1',
        latitude: 3.142,
        longitude: 101.689,
        affects: ['wheelchair'],
        type: 'blocked_ramp',
      }],
      error: null,
    });

    const result = await routingService.calculatePath(
      { lat: 3.139, lng: 101.686 },
      { lat: 3.147, lng: 101.695 },
      ['wheelchair']
    );

    expect(orsClient.post).toHaveBeenCalledWith(
      '/v2/directions/foot-walking/geojson',
      expect.objectContaining({
        coordinates: [[101.686, 3.139], [101.695, 3.147]],
        options: {
          avoid_polygons: expect.objectContaining({ type: 'MultiPolygon' }),
        },
      })
    );
    expect(result.features[0].properties.distance_meters).toBe(1420.5);
    expect(result.features[0].properties.duration_seconds).toBe(1022);
    expect(result.features[0].properties.obstacles_avoided).toBe(1);
  });

  test('ignores invalid obstacle coordinates', () => {
    const result = routingService._buildAvoidPolygons([
      { latitude: 'invalid', longitude: 101.686 },
      { latitude: 3.139, longitude: 101.686 },
    ]);

    expect(result.coordinates).toHaveLength(1);
  });
});
