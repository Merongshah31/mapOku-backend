const supabase = require('../config/supabase');

const DOWNVOTE_ARCHIVE_THRESHOLD = parseInt(
  process.env.DOWNVOTE_ARCHIVE_THRESHOLD || '3',
  10
);

/**
 * ReputationService
 * Manages voting on obstacles and auto-archiving logic.
 * Implements "Still there?" / "Cleared!" Waze-style confirmation flow.
 */
class ReputationService {
  /**
   * Casts or updates a vote on an obstacle, then recalculates
   * vote counts and auto-archives if downvote threshold is reached.
   *
   * @param {string} obstacleId - UUID of the obstacle
   * @param {string} userId     - UUID of the voting user
   * @param {string} voteType   - 'upvote' | 'downvote'
   * @returns {Object} Updated obstacle record with new vote counts
   */
  async updateObstacleStatus(obstacleId, userId, voteType) {
    // 1. Verify obstacle exists and is active
    const { data: obstacle, error: fetchError } = await supabase
      .from('obstacles')
      .select('id, status, upvotes, downvotes')
      .eq('id', obstacleId)
      .single();

    if (fetchError || !obstacle) {
      const err = new Error('Obstacle not found.');
      err.status = 404;
      throw err;
    }

    if (obstacle.status === 'archived') {
      const err = new Error('Cannot vote on an archived obstacle.');
      err.status = 409;
      throw err;
    }

    // 2. Upsert vote — ON CONFLICT updates existing vote
    const { error: voteError } = await supabase
      .from('votes')
      .upsert(
        { obstacle_id: obstacleId, user_id: userId, vote_type: voteType },
        { onConflict: 'obstacle_id,user_id' }
      );

    if (voteError) {
      const err = new Error(`Failed to record vote: ${voteError.message}`);
      err.status = 500;
      throw err;
    }

    // 3. Recalculate vote counts via RPC (atomic update in DB)
    const { error: rpcError } = await supabase.rpc('recalculate_obstacle_votes', {
      p_obstacle_id: obstacleId,
    });

    if (rpcError) {
      console.error('[ReputationService] RPC error:', rpcError.message);
    }

    // 4. Fetch updated obstacle to return current state
    const { data: updated } = await supabase
      .from('obstacles')
      .select('id, status, upvotes, downvotes')
      .eq('id', obstacleId)
      .single();

    // 5. Update reporter's reputation score
    if (obstacle.user_id) {
      await this._updateReporterReputation(obstacle.user_id, updated?.status === 'archived');
    }

    return updated;
  }

  /**
   * Rewards the obstacle reporter:
   * +1 reputation for each upvote confirmation.
   * -1 reputation if obstacle is archived (false report).
   *
   * @param {string} reporterId
   * @param {boolean} wasArchived
   */
  async _updateReporterReputation(reporterId, wasArchived) {
    try {
      const delta = wasArchived ? -1 : 1;
      await supabase.rpc('increment_reputation', {
        p_user_id: reporterId,
        p_delta: delta,
      });
    } catch (err) {
      // Non-critical — log and continue
      console.error('[ReputationService] Failed to update reputation:', err.message);
    }
  }
}

module.exports = new ReputationService();
