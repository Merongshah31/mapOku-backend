const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Mapoku Backend API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Accessible routing API for Mapoku. Use this documentation to explore, understand, and test the REST endpoints.',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: process.env.API_BASE_URL ? 'Configured API server' : 'Local development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service health checks' },
      { name: 'Users', description: 'Registration, authentication, and profiles' },
      { name: 'Routes', description: 'Accessible pedestrian routing' },
      { name: 'Obstacles', description: 'Obstacle reports and community verification' },
      { name: 'Reports', description: 'Authenticated obstacle reports and summaries' },
      { name: 'Weather', description: 'Current weather conditions for map locations' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation Error' },
            message: { type: 'string', example: 'Request contains invalid fields.' },
          },
        },
        UserCredentials: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'securepassword123' },
          },
        },
        Obstacle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
            latitude: { type: 'number', format: 'double', example: 3.141 },
            longitude: { type: 'number', format: 'double', example: 101.688 },
            type: { $ref: '#/components/schemas/ObstacleType' },
            description: { type: 'string', example: 'Large crack on the sidewalk.' },
            image_url: { type: 'string', format: 'uri', nullable: true },
            status: { type: 'string', enum: ['active', 'archived', 'under_review'], example: 'active' },
            upvotes: { type: 'integer', example: 5 },
            downvotes: { type: 'integer', example: 0 },
            affects: { type: 'array', items: { $ref: '#/components/schemas/AccessibilityNeed' } },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ObstacleType: {
          type: 'string',
          enum: ['broken_pavement', 'steep_ramp', 'missing_curb_cut', 'construction', 'flooded_path', 'narrow_passage', 'no_tactile_paving', 'blocked_ramp', 'uneven_surface', 'other'],
          example: 'broken_pavement',
        },
        AccessibilityNeed: {
          type: 'string',
          enum: ['wheelchair', 'visually_impaired', 'elderly', 'stroller', 'hearing_impaired'],
          example: 'wheelchair',
        },
        GeoJSONRoute: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'FeatureCollection' },
            features: { type: 'array', items: { type: 'object' } },
            metadata: { type: 'object' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'], summary: 'Check API health', description: 'Returns the current service status and server timestamp.',
          responses: { 200: { description: 'Service is healthy', content: { 'application/json': { example: { status: 'ok', service: 'mapoku-backend', timestamp: '2026-09-05T08:00:00.000Z', version: '1.0.0' } } } } },
        },
      },
      '/api/v1/users/register': {
        post: {
          tags: ['Users'], summary: 'Register a user', description: 'Creates a Supabase Auth account and profile.',
          requestBody: { required: true, content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/UserCredentials' }, { type: 'object', required: ['username'], properties: { username: { type: 'string', example: 'mapoku_user' } } }] }, example: { email: 'user@example.com', password: 'securepassword123', username: 'mapoku_user' } } } },
          responses: { 201: { description: 'Account created', content: { 'application/json': { example: { success: true, message: 'Account created successfully. Please check your email to verify your account.', data: { user_id: 'a9c1e7a4-850f-4882-9659-19ffce3d7dc2', email: 'user@example.com' } } } } }, 400: { description: 'Invalid registration request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
        },
      },
      '/api/v1/users/login': {
        post: {
          tags: ['Users'], summary: 'Log in a user', description: 'Authenticates a user and returns Supabase JWT session tokens.',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCredentials' }, example: { email: 'user@example.com', password: 'securepassword123' } } } },
          responses: { 200: { description: 'Login successful', content: { 'application/json': { example: { success: true, data: { access_token: 'eyJhbGciOiJIUzI1NiIsIn...', refresh_token: 'refresh-token', expires_in: 3600, user: { id: 'a9c1e7a4-850f-4882-9659-19ffce3d7dc2', email: 'user@example.com' } } } } } }, 401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
        },
      },
      '/api/v1/users/me': {
        get: {
          tags: ['Users'], summary: 'Get my profile', description: 'Profile lookup is temporarily unavailable while authentication is disabled.',
          responses: { 503: { description: 'Authentication is temporarily disabled' } },
        },
      },
      '/api/v1/routes/accessible': {
        get: {
          tags: ['Routes'], summary: 'Calculate an accessible route', description: 'Calculates a pedestrian route through OpenRouteService while avoiding active relevant obstacles with small GeoJSON avoidance zones.',
          parameters: [
            { name: 'startLat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 }, example: 3.139 },
            { name: 'startLng', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 }, example: 101.686 },
            { name: 'endLat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 }, example: 3.147 },
            { name: 'endLng', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 }, example: 101.695 },
            { name: 'accessibilityNeeds', in: 'query', required: false, schema: { type: 'string', example: 'wheelchair,elderly' }, description: 'Comma-separated accessibility needs.' },
          ],
          responses: { 200: { description: 'Route calculated', content: { 'application/json': { example: { success: true, data: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[101.686, 3.139], [101.695, 3.147]] }, properties: { distance_meters: 1420.5, duration_seconds: 1022, accessibility_needs: ['wheelchair'], obstacles_avoided: 2, waypoints_count: 2 } }], metadata: { obstacles_on_route: [] } } } } } }, 400: { description: 'Invalid coordinates or accessibility needs' }, 422: { description: 'No valid route found or ORS rejected the request' }, 502: { description: 'OpenRouteService unavailable' } },
        },
      },
      '/api/v1/weather/current': {
        get: {
          tags: ['Weather'],
          summary: 'Get current weather',
          description: 'Returns current weather conditions for a latitude and longitude using OpenWeatherMap.',
          parameters: [
            { name: 'lat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 }, example: 3.139 },
            { name: 'lon', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 }, example: 101.686 },
          ],
          responses: {
            200: {
              description: 'Current weather returned',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      location: { name: 'Kuala Lumpur', country: 'MY', latitude: 3.139, longitude: 101.686 },
                      weather: { id: 800, main: 'Clear', description: 'langit cerah', icon: '01d' },
                      temperature: { current: 30.2, feels_like: 34.1, minimum: 29.5, maximum: 31.0, humidity: 70 },
                      wind: { speed: 2.1, direction: 180 },
                      visibility_meters: 10000,
                      observed_at: '2026-09-06T08:00:00.000Z',
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid coordinates' },
            502: { description: 'OpenWeatherMap unavailable or API key rejected' },
          },
        },
      },
      '/api/v1/obstacles': {
        get: {
          tags: ['Obstacles'], summary: 'List obstacles in a map viewport', description: 'Returns active obstacles inside the requested latitude/longitude bounding box.',
          parameters: [
            { name: 'minLat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 }, example: 3.13 },
            { name: 'minLng', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 }, example: 101.68 },
            { name: 'maxLat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 }, example: 3.15 },
            { name: 'maxLng', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 }, example: 101.70 },
          ],
          responses: { 200: { description: 'Obstacles returned', content: { 'application/json': { example: { success: true, count: 1, data: [{ $ref: '#/components/schemas/Obstacle' }] } } } }, 400: { description: 'Invalid bounding box' }, 500: { description: 'Database failure' } },
        },
        post: {
          tags: ['Obstacles'], summary: 'Report an obstacle', description: 'Creates an obstacle report without requiring Bearer JWT authentication while temporary access is enabled.',
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['latitude', 'longitude', 'type'], properties: { latitude: { type: 'number', example: 3.141 }, longitude: { type: 'number', example: 101.688 }, type: { $ref: '#/components/schemas/ObstacleType' }, description: { type: 'string', maxLength: 500, example: 'Large crack on the sidewalk.' }, affects: { type: 'string', example: '["wheelchair","stroller"]' }, image: { type: 'string', format: 'binary' } } }, encoding: { affects: { contentType: 'application/json' } } } } },
          responses: { 201: { description: 'Obstacle created', content: { 'application/json': { example: { success: true, message: 'Obstacle reported successfully. Thank you for contributing to Mapoku!', data: { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', latitude: 3.141, longitude: 101.688, type: 'broken_pavement', status: 'active' } } } } }, 400: { description: 'Invalid obstacle data' }, 500: { description: 'Database or upload failure' } },
        },
      },
      '/api/v1/obstacles/{id}/upvote': {
        put: {
          tags: ['Obstacles'], summary: 'Confirm an obstacle', description: 'Records that an active obstacle is still present. Bearer JWT authentication is temporarily disabled, but a user identity is still required by the voting data model.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' }],
          responses: { 200: { description: 'Vote recorded', content: { 'application/json': { example: { success: true, message: 'Thank you for confirming this obstacle is still there.', data: { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', status: 'active', upvotes: 6, downvotes: 0 } } } } }, 404: { description: 'Obstacle not found' }, 409: { description: 'Obstacle is archived' }, 503: { description: 'A user identity is required for voting' } },
        },
      },
      '/api/v1/obstacles/{id}/downvote': {
        put: {
          tags: ['Obstacles'], summary: 'Report an obstacle as cleared', description: 'Records that an obstacle is gone. Bearer JWT authentication is temporarily disabled, but a user identity is still required by the voting data model.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' }],
          responses: { 200: { description: 'Vote recorded', content: { 'application/json': { example: { success: true, message: 'Obstacle has been cleared and removed from the map.', data: { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', status: 'archived', upvotes: 5, downvotes: 3 } } } } }, 404: { description: 'Obstacle not found' }, 409: { description: 'Obstacle is archived' }, 503: { description: 'A user identity is required for voting' } },
        },
      },
      '/api/v1/reports/me': {
        get: {
          tags: ['Reports'], summary: 'List my obstacle reports', description: 'Returns the authenticated user\'s obstacle reports, status summary, and pagination metadata.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 }, example: 1 },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, example: 20 },
            { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['active', 'archived', 'under_review'] }, example: 'active' },
          ],
          responses: {
            200: {
              description: 'Reports returned',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      summary: { active: 2, archived: 1, under_review: 0 },
                      reports: [{
                        id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
                        latitude: 3.141,
                        longitude: 101.688,
                        type: 'broken_pavement',
                        description: 'Large crack on the sidewalk.',
                        image_url: null,
                        status: 'active',
                        upvotes: 2,
                        downvotes: 0,
                        affects: ['wheelchair'],
                        created_at: '2026-09-05T08:00:00.000Z',
                        updated_at: '2026-09-05T08:00:00.000Z',
                      }],
                      pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid status filter' },
            401: { description: 'Missing or invalid Bearer token' },
            500: { description: 'Database failure' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJSDoc(options);