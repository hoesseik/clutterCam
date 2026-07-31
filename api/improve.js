const { OpenAI, toFile } = require('openai');

// Vercel instructie: verhoog de body-parser limiet voor grote base64 afbeeldingen
const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const handler = async function (req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, room } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen in de body' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Zet de Base64-afbeelding om naar een Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 2. Converteer de Buffer naar een virtueel bestand voor de OpenAI SDK
    const imageFile = await toFile(imageBuffer, 'original_room.png', { type: 'image/png' });

    // 3. Image-to-Image Edit API call
    const response = await openai.images.edit({
      model: "gpt-image-1.5",
      image: imageFile,
      prompt: `Transform this exact ${room || "room"} into a clean, tidy, and perfectly organized version. Keep the exact same room structure, walls, window placement, bed/furniture position, and floor type. Remove all clutter, clothes on the floor or bed, trash, and mess. Make it clean and well-lit while preserving the original layout.`,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response?.data?.[0]?.url || response?.data?.[0]?.b64_json;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Geen afbeelding ontvangen van OpenAI Edit API' });
    }

    return res.status(200).json({
      message: 'Image improved successfully',
      improvedImage: imageUrl,
    });

  } catch (error) {
    console.error('Improve error:', error.message);
    return res.status(500).json({
      error: 'Failed to generate improved image',
      details: error.message,
    });
  }
};

module.exports = handler;
module.exports.config = config;