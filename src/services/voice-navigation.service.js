const { v1: speech } = require('@google-cloud/speech');

const DEFAULT_LANGUAGE_CODE = process.env.GOOGLE_SPEECH_LANGUAGE_CODE || 'ms-MY';
const DEFAULT_MODEL = process.env.GOOGLE_SPEECH_MODEL || 'latest_short';
const SUPPORTED_ENCODINGS = new Set(['LINEAR16', 'FLAC', 'MP3', 'OGG_OPUS', 'WEBM_OPUS']);
let client;

const httpError = (message, status) => Object.assign(new Error(message), { status });
const getClient = () => {
  if (!client) client = new speech.SpeechClient();
  return client;
};
const normalise = (text) => text.toLocaleLowerCase('ms-MY').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

// The frontend executes the returned intent; the backend never changes navigation state.
const parseNavigationCommand = (transcript) => {
  const text = normalise(transcript);
  const has = (...phrases) => phrases.some((phrase) => text.includes(phrase));
  const destination = text.match(/(?:navigasi|bawa saya|pergi|navigate|go|take me)\s+(?:ke|to)?\s*(.+)/i)?.[1]
    ?.replace(/^(?:ke|to)\s+/i, '').replace(/\b(sekarang|please|tolong)$/i, '').trim();
  if (destination) return { type: 'NAVIGATE_TO_DESTINATION', destination };
  if (has('mula navigasi', 'mulakan navigasi', 'start navigation', 'start guidance')) return { type: 'START_NAVIGATION' };
  if (has('henti navigasi', 'berhenti navigasi', 'tamat navigasi', 'stop navigation', 'end navigation')) return { type: 'STOP_NAVIGATION' };
  if (has('jeda', 'pause')) return { type: 'PAUSE_NAVIGATION' };
  if (has('sambung', 'resume', 'continue')) return { type: 'RESUME_NAVIGATION' };
  if (has('ulang', 'repeat', 'sekali lagi')) return { type: 'REPEAT_INSTRUCTION' };
  if (has('arahan seterusnya', 'langkah seterusnya', 'next instruction', 'next step')) return { type: 'NEXT_INSTRUCTION' };
  if (has('arahan sebelum', 'langkah sebelum', 'previous instruction', 'previous step', 'kembali')) return { type: 'PREVIOUS_INSTRUCTION' };
  if (has('senyap', 'mute')) return { type: 'MUTE_GUIDANCE' };
  if (has('bunyi', 'unmute', 'hidupkan suara')) return { type: 'UNMUTE_GUIDANCE' };
  if (has('lapor halangan', 'report obstacle')) return { type: 'REPORT_OBSTACLE' };
  return { type: 'UNKNOWN' };
};

const transcribeNavigationAudio = async (file, options = {}) => {
  if (!file?.buffer?.length) throw httpError('An audio file is required.', 400);
  const encoding = options.encoding || process.env.GOOGLE_SPEECH_ENCODING || 'WEBM_OPUS';
  if (!SUPPORTED_ENCODINGS.has(encoding)) throw httpError(`Unsupported audio encoding: ${encoding}.`, 400);
  const sampleRateHertz = options.sampleRateHertz ? Number(options.sampleRateHertz) : undefined;
  if (sampleRateHertz && (!Number.isInteger(sampleRateHertz) || sampleRateHertz < 8000 || sampleRateHertz > 48000)) throw httpError('sampleRateHertz must be an integer between 8000 and 48000.', 400);
  try {
    const [response] = await getClient().recognize({
      audio: { content: file.buffer.toString('base64') },
      config: { encoding, languageCode: options.languageCode || DEFAULT_LANGUAGE_CODE, model: options.model || DEFAULT_MODEL, enableAutomaticPunctuation: true, ...(sampleRateHertz && { sampleRateHertz }), ...(options.alternativeLanguageCodes && { alternativeLanguageCodes: options.alternativeLanguageCodes }) },
    });
    const transcript = (response.results || []).map((item) => item.alternatives?.[0]?.transcript || '').filter(Boolean).join(' ').trim();
    return { transcript, confidence: response.results?.[0]?.alternatives?.[0]?.confidence ?? null, navigationCommand: parseNavigationCommand(transcript) };
  } catch (error) {
    if (error.status) throw error;
    if ([3, 7, 16].includes(error.code)) throw httpError('Google Speech-to-Text rejected the audio or credentials.', 502);
    if ([5, 9].includes(error.code)) throw httpError('Google Speech-to-Text is not configured for this project.', 503);
    throw error;
  }
};

module.exports = { parseNavigationCommand, transcribeNavigationAudio };
