jest.mock('../src/config/vertex', () => ({
  vertexClient: { post: jest.fn() },
  getGenerateContentPath: jest.fn(() => '/v1/projects/test-project/locations/global/publishers/google/models/gemini-2.0-flash-001:generateContent'),
  VERTEX_AI_MODEL: 'gemini-2.0-flash-001',
}));

const { vertexClient } = require('../src/config/vertex');
const { validateObstacleImage, parseModelJson } = require('../src/services/image-validation.service');

describe('ImageValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VERTEX_AI_API_KEY = 'test-key';
  });

  test('parses a structured validation verdict', () => {
    expect(parseModelJson('{"is_obstacle":true,"is_spam":false,"confidence":0.91,"detected_type":"blocked_ramp","reason":"A blocked accessibility ramp is visible."}'))
      .toEqual(expect.objectContaining({ is_obstacle: true, is_spam: false, confidence: 0.91 }));
  });

  test('sends an image to Vertex and returns its verdict', async () => {
    vertexClient.post.mockResolvedValue({
      data: {
        candidates: [{ content: { parts: [{ text: '{"is_obstacle":true,"is_spam":false,"confidence":0.88,"detected_type":"construction","reason":"Construction blocks the path."}' }] } }],
      },
    });

    const result = await validateObstacleImage({
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/jpeg',
    });

    expect(vertexClient.post).toHaveBeenCalledWith(
      expect.stringContaining(':generateContent'),
      expect.objectContaining({ contents: expect.any(Array) }),
      { headers: { 'x-goog-api-key': 'test-key' } }
    );
    expect(result).toEqual(expect.objectContaining({ is_obstacle: true, confidence: 0.88 }));
  });

  test('rejects missing images before calling Vertex', async () => {
    await expect(validateObstacleImage(null)).rejects.toMatchObject({ status: 400 });
    expect(vertexClient.post).not.toHaveBeenCalled();
  });
});
