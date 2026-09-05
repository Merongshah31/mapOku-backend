const supabase = require('../config/supabase');

const moderateObstacle = async (obstacleId, decision, moderatorNote = null) => {
  const isApproved = decision === 'approve';
  const isRejected = decision === 'reject';

  if (!isApproved && !isRejected) {
    const error = new Error('decision must be approve or reject.');
    error.status = 400;
    throw error;
  }

  const updates = {
    status: isApproved ? 'active' : 'archived',
    ai_validation_status: isApproved ? 'approved' : 'rejected',
    ai_validated_at: new Date().toISOString(),
  };

  if (moderatorNote) {
    updates.ai_reason = moderatorNote;
  }

  const { data, error } = await supabase
    .from('obstacles')
    .update(updates)
    .eq('id', obstacleId)
    .eq('status', 'under_review')
    .select()
    .single();

  if (error || !data) {
    const notFound = new Error('Under-review obstacle not found.');
    notFound.status = 404;
    throw notFound;
  }

  return data;
};

module.exports = { moderateObstacle };
