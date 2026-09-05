jest.mock('../src/config/supabase', () => ({
  from: jest.fn(),
}));

const supabase = require('../src/config/supabase');
const { moderateObstacle } = require('../src/services/moderation.service');

describe('ModerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approves an under-review obstacle', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'obstacle-1', status: 'active', ai_validation_status: 'approved' },
      error: null,
    });
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single,
    };
    supabase.from.mockReturnValue(query);

    const result = await moderateObstacle('obstacle-1', 'approve', 'Looks valid.');

    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active',
      ai_validation_status: 'approved',
      ai_reason: 'Looks valid.',
    }));
    expect(query.eq).toHaveBeenCalledWith('status', 'under_review');
    expect(result.status).toBe('active');
  });

  test('rejects an invalid moderation decision', async () => {
    await expect(moderateObstacle('obstacle-1', 'publish'))
      .rejects.toMatchObject({ status: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
