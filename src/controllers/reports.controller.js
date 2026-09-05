const supabase = require('../config/supabase');

const REPORT_STATUSES = ['active', 'archived', 'under_review'];

/**
 * GET /api/v1/reports/me
 * Returns the authenticated user's obstacle reports and a summary.
 */
const getMyReports = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const status = req.query.status;
    const offset = (page - 1) * limit;

    if (status && !REPORT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `status must be one of: ${REPORT_STATUSES.join(', ')}`,
      });
    }

    const buildQuery = (count = false) => {
      let query = supabase
        .from('obstacles')
        .select(
          count
            ? 'id, status'
            : 'id, latitude, longitude, type, description, image_url, status, upvotes, downvotes, affects, created_at, updated_at',
          count ? { count: 'exact', head: true } : undefined
        )
        .eq('user_id', req.user.id);

      if (status) query = query.eq('status', status);
      return query;
    };

    const [{ data: reports, error: reportsError, count }, { data: summaryRows, error: summaryError }] = await Promise.all([
      buildQuery()
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      buildQuery(true),
    ]);

    if (reportsError || summaryError) {
      const error = reportsError || summaryError;
      const err = new Error(`Failed to fetch reports: ${error.message}`);
      err.status = 500;
      throw err;
    }

    const summary = REPORT_STATUSES.reduce((totals, reportStatus) => {
      totals[reportStatus] = (summaryRows || []).filter(
        (report) => report.status === reportStatus
      ).length;
      return totals;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        summary,
        reports: reports || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyReports };