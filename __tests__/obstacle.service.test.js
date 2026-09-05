jest.mock('../src/config/supabase', () => ({
  from: jest.fn(),
}));
jest.mock('../src/services/storage.service', () => ({
  uploadImage: jest.fn(),
}));
jest.mock('../src/services/image-validation.service', () => ({
  validateObstacleImage: jest.fn(),
}));

const supabase = require('../src/config/supabase');
const storageService = require('../src/services/storage.service');
const { validateObstacleImage } = require('../src/services/image-validation.service');
const obstacleService = require('../src/services/obstacle.service');

describe('ObstacleService AI validation flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateObstacleImage.mockResolvedValue({
      is_obstacle: true,
      is_spam: false,
      confidence: 0.9,
      detected_type: 'blocked_ramp',
      reason: 'A blocked ramp is visible.',
      model: 'test-model',
    });
    storageService.uploadImage.mockResolvedValue('https://storage.example/image.jpg');
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'obstacle-1', status: 'under_review' },
            error: null,
          }),
        }),
      }),
    });
  });

  test('validates before storage and creates an under-review obstacle', async () => {
    const image = { buffer: Buffer.from('image'), mimetype: 'image/jpeg', originalname: 'lift.jpg' };
    const result = await obstacleService.createAndNotify({
      latitude: '3.139',
      longitude: '101.686',
      type: 'blocked_ramp',
      affects: ['wheelchair'],
      userId: null,
    }, image);

    expect(validateObstacleImage).toHaveBeenCalledWith(image);
    expect(storageService.uploadImage).toHaveBeenCalled();
    expect(result.status).toBe('under_review');
  });

  test('does not upload when AI validation fails', async () => {
    validateObstacleImage.mockRejectedValue(Object.assign(new Error('AI unavailable'), { status: 503 }));
    const image = { buffer: Buffer.from('image'), mimetype: 'image/jpeg', originalname: 'lift.jpg' };

    await expect(obstacleService.createAndNotify({ latitude: '3.139', longitude: '101.686' }, image))
      .rejects.toMatchObject({ status: 503 });
    expect(storageService.uploadImage).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
