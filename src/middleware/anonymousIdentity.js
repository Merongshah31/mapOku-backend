/**
 * Identifies an anonymous visitor for actions that must be de-duplicated.
 * This is not authentication. Clients persist a UUID and send it as
 * `X-Anonymous-Id` with a vote request.
 */
const requireAnonymousIdentity = (req, res, next) => {
  const anonymousId = req.get('X-Anonymous-Id');

  if (!anonymousId || anonymousId.length > 128) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'X-Anonymous-Id is required to vote (maximum 128 characters).',
    });
  }

  req.anonymousId = anonymousId;
  return next();
};

module.exports = { requireAnonymousIdentity };
