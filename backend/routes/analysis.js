const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SPECIES = new Set(['tiger', 'lion', 'leopard', 'elephant', 'other', 'unknown']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

router.post('/wildlife', requireAuth, async (req, res) => {
  const image = req.body && req.body.image;
  if (typeof image !== 'string') return res.status(400).json({ error: 'An image data URL is required' });

  const match = image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match || !IMAGE_TYPES.has(match[1])) {
    return res.status(400).json({ error: 'Use a JPEG, PNG, WEBP, or GIF image' });
  }
  if (image.length > 14 * 1024 * 1024) {
    return res.status(413).json({ error: 'Image is too large for analysis. Choose a smaller image.' });
  }
  if (!process.env.OPENAI_API_KEY) return res.json({ configured: false });

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        store: false,
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Identify visible animals for a wildlife safety app, regardless of whether the image is a camera photo, web image, edited picture, illustration, or synthetic. Return JSON only with keys species, confidence, status, animal_detected, reason. animal_detected is true if any animal is visible and recognizable. species must be tiger, lion, leopard, elephant, other, or unknown. status must be detected, no_dangerous_animal, or uncertain. Use tiger, lion, leopard, or elephant for those visibly recognized species. Use other only for a visibly identified dangerous wild animal such as bear, wolf, crocodile, or cobra. For a recognizable animal that is not considered dangerous, return species unknown, status no_dangerous_animal, animal_detected true, and include its common name in reason, such as "Deer detected; no listed dangerous wildlife". Use uncertain only when no animal can be reliably identified. Use no_dangerous_animal only when no listed dangerous animal is visible. confidence is an integer from 0 to 100 reflecting visual certainty, not danger. Do not infer species from location or background. Keep reason under 140 characters.',
            },
            { type: 'input_image', image_url: image, detail: 'high' },
          ],
        }],
        text: { format: { type: 'json_object' } },
      }),
      signal: AbortSignal.timeout(30000),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error('Wildlife vision API returned an error:', response.status, payload.error?.code || payload.error?.type || 'unknown');
      return res.status(502).json({ error: 'Image analysis service failed. You can still submit the sighting for review.' });
    }

    const outputText = payload.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === 'output_text')?.text;
    if (!outputText) throw new Error('No classification returned');

    const result = JSON.parse(outputText);
    const species = SPECIES.has(result.species) ? result.species : 'unknown';
    const status = ['detected', 'no_dangerous_animal', 'uncertain'].includes(result.status)
      ? result.status
      : 'uncertain';
    const confidence = Math.max(0, Math.min(100, Math.round(Number(result.confidence) || 0)));

    res.json({
      configured: true,
      mode: 'vision-api',
      species,
      confidence,
      status,
      animalDetected: result.animal_detected === true || ['tiger', 'lion', 'leopard', 'elephant', 'other'].includes(species),
      reason: typeof result.reason === 'string' ? result.reason.slice(0, 140) : '',
    });
  } catch (err) {
    console.error('Wildlife image analysis failed:', err.message);
    res.status(502).json({ error: 'Image analysis service is unavailable. You can still submit the sighting for review.' });
  }
});

module.exports = router;
