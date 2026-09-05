const supabase = require('../config/supabase');
const storageService = require('./storage.service');

/**
 * ObstacleService
 * Handles creation, retrieval, and notification of obstacles.
 * Supabase Realtime automatically broadcasts DB changes to subscribed clients.
 */
class ObstacleService {
  /**
   * Creates a new obstacle report.
   * Uploads image to Supabase Storage if provided.
   * Supabase Realtime broadcasts the INSERT automatically.
   *
   * @param {Object} obstacleData - { latitude, longitude, type, description, affects, userId }
   * @param {Object|null} imageFile - Multer file object (buffer, mimetype, originalname)
   * @returns {Object} The created obstacle record
   */
  async createAndNotify(obstacleData, imageFile = null) {
    const { latitude, longitude, type, description, affects, userId } = obstacleData;

    // 1. Upload image if provided
    let imageUrl = null;
    if (imageFile) {
      const ext = imageFile.originalname.split('.').pop();
      const path = `${userId || 'anonymous'}/${Date.now()}.${ext}`;
      imageUrl = await storageService.uploadImage(imageFile.buffer, path, imageFile.mimetype);
    }

    // 2. Insert obstacle into DB
    // location is a PostGIS GEOGRAPHY point — format: POINT(lng lat)
    const { data, error } = await supabase
      .from('obstacles')
      .insert({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location: `POINT(${longitude} ${latitude})`,
        type,
        description: description || null,
        image_url: imageUrl,
        user_id: userId || null,
        affects: affects || [],
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      const err = new Error(`Failed to create obstacle: ${error.message}`);
      err.status = 500;
      throw err;
    }

    // Note: Supabase Realtime automatically broadcasts this INSERT
    // to any frontend client subscribed to the 'obstacles' table channel.
    // No additional WebSocket code needed here.

    return data;
  }

  /**
   * Fetches all active obstacles within a geographic bounding box.
   * Uses PostGIS ST_MakeEnvelope via Supabase RPC for efficient spatial query.
   *
   * @param {number} minLat
   * @param {number} minLng
   * @param {number} maxLat
   * @param {number} maxLng
   * @returns {Array} Array of obstacle records
   */
  async getObstaclesInBoundingBox(minLat, minLng, maxLat, maxLng) {
    const { data, error } = await supabase.rpc('get_obstacles_in_bbox', {
      min_lat: parseFloat(minLat),
      min_lng: parseFloat(minLng),
      max_lat: parseFloat(maxLat),
      max_lng: parseFloat(maxLng),
    });

    if (error) {
      const err = new Error(`Failed to fetch obstacles: ${error.message}`);
      err.status = 500;
      throw err;
    }

    return data || [];
  }

  /**
   * Fetches a single obstacle by ID.
   *
   * @param {string} obstacleId - UUID
   * @returns {Object} Obstacle record
   */
  async getObstacleById(obstacleId) {
    const { data, error } = await supabase
      .from('obstacles')
      .select('*, profiles(username, reputation_score)')
      .eq('id', obstacleId)
      .single();

    if (error || !data) {
      const err = new Error('Obstacle not found.');
      err.status = 404;
      throw err;
    }

    return data;
  }
}

module.exports = new ObstacleService();
