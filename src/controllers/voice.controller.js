const { transcribeNavigationAudio } = require('../services/voice-navigation.service');

const transcribeNavigation = async (req, res, next) => {
  try {
    const data = await transcribeNavigationAudio(req.file, {
      languageCode: req.body.languageCode,
      encoding: req.body.encoding,
      sampleRateHertz: req.body.sampleRateHertz,
      model: req.body.model,
      alternativeLanguageCodes: req.body.alternativeLanguageCodes
        ? String(req.body.alternativeLanguageCodes).split(',').map((code) => code.trim()).filter(Boolean)
        : undefined,
    });
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = { transcribeNavigation };
