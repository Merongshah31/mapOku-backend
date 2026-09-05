const { vertexClient, getGenerateContentPath, VERTEX_AI_MODEL } = require('../config/vertex');

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const VALIDATION_PROMPT = `You are an image validator for a crowdsourced accessibility map.
Analyze the uploaded image and return ONLY valid JSON with this exact shape:
{
  "is_obstacle": boolean,
  "is_spam": boolean,
  "confidence": number,
  "detected_type": string|null,
  "reason": string
}

An obstacle is a visible physical accessibility problem such as a broken lift, blocked ramp, construction, flood, broken pavement, or inaccessible passage. Do not identify people. If the image is unrelated, blank, a screenshot, promotional content, or repeated/spam-like content, set is_spam to true. Keep reason short and factual. confidence must be between 0 and 1.`;

const parseModelJson = (text) => {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  const confidence = Number(parsed.confidence);

  if (typeof parsed.is_obstacle !== 'boolean' || typeof parsed.is_spam !== 'boolean') {
    throw new Error('Vertex response has an invalid verdict.');
  }

  return {
    is_obstacle: parsed.is_obstacle,
    is_spam: parsed.is_spam,
    confidence: Number.isFinite(confidence) ? Math.min(Math.max(confidence, 0), 1) : 0,
    detected_type: typeof parsed.detected_type === 'string' ? parsed.detected_type : null,
    reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 500) : 'No reason provided.',
    model: VERTEX_AI_MODEL,
  };
};

const validateObstacleImage = async (file) => {
  if (!file || !file.buffer) {
    const error = new Error('An obstacle image is required.');
    error.status = 400;
    throw error;
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
    const error = new Error('Only JPEG, PNG, WebP, or GIF images are supported.');
    error.status = 422;
    throw error;
  }

  const apiKey = process.env.VERTEX_AI_API_KEY;
  const path = getGenerateContentPath();
  if (!apiKey || !path) {
    const error = new Error('Vertex AI image validation is not configured.');
    error.status = 503;
    throw error;
  }

  try {
    const response = await vertexClient.post(
      path,
      {
        contents: [{
          role: 'user',
          parts: [
            { text: VALIDATION_PROMPT },
            { inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } },
          ],
        }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      },
      { headers: { 'x-goog-api-key': apiKey } }
    );

    const text = response.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('');

    if (!text) {
      throw new Error('Vertex returned an empty validation response.');
    }

    return parseModelJson(text);
  } catch (err) {
    if (err.status) throw err;

    const error = new Error('Vertex AI image validation failed.');
    error.status = err.response?.status === 401 || err.response?.status === 403 ? 503 : 502;
    throw error;
  }
};

module.exports = {
  validateObstacleImage,
  parseModelJson,
  SUPPORTED_IMAGE_TYPES,
};
