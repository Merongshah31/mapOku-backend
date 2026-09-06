# Voice Navigation API

`POST /api/v1/voice/transcribe` converts a short voice command to text with Google Cloud Speech-to-Text and returns a client-side navigation intent.

Send `multipart/form-data` with an `audio` file (maximum 10 MB). Browser `MediaRecorder` recordings normally use `audio/webm`; send `encoding=WEBM_OPUS` (the default). Optional fields are `languageCode` (default `ms-MY`), `sampleRateHertz`, `model`, and comma-separated `alternativeLanguageCodes`.

```bash
curl -X POST http://localhost:3000/api/v1/voice/transcribe \
  -F "audio=@command.webm;type=audio/webm" \
  -F "encoding=WEBM_OPUS" \
  -F "languageCode=ms-MY"
```

Example response:

```json
{
  "success": true,
  "data": {
    "transcript": "Bawa saya ke Hospital Kuala Lumpur",
    "confidence": 0.94,
    "navigationCommand": {
      "type": "NAVIGATE_TO_DESTINATION",
      "destination": "hospital kuala lumpur"
    }
  }
}
```

Recognised command types: `NAVIGATE_TO_DESTINATION`, `START_NAVIGATION`, `STOP_NAVIGATION`, `PAUSE_NAVIGATION`, `RESUME_NAVIGATION`, `REPEAT_INSTRUCTION`, `NEXT_INSTRUCTION`, `PREVIOUS_INSTRUCTION`, `MUTE_GUIDANCE`, `UNMUTE_GUIDANCE`, `REPORT_OBSTACLE`, and `UNKNOWN`.

Before calling the endpoint, enable Cloud Speech-to-Text in the Google Cloud project. Locally, set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file with Speech-to-Text access. On Vercel, set `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` to the base64-encoded contents of that JSON key; never commit or deploy the JSON file.
