const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const handler = async function (req, res) {
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
    // Check de environment variables voor de API key
    if (!process.env.OPENAI_API_KEY) {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
          if (match && match[1]) {
            process.env.OPENAI_API_KEY = match[1].trim().replace(/^"|"$/g, '');
          }
        } catch (e) {
          console.log('Fout bij lezen van .env.local:', e.message);
        }
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is niet ingesteld.');
    }

    // Haal de categorie op, of val terug op "kamer"
    const { room } = req.body || {};
    const roomType = room ? room.toLowerCase() : "kamer";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Dynamische Nederlandse prompt, afgestemd op jouw gekozen knop
    const prompt = `Een fotorealistische afbeelding van een perfect schone, opgeruimde en prachtig ingerichte ${roomType}. Geen rommel op de grond, goed verlicht, modern en professioneel interieur design.`;

    // Aangepast naar het officiële DALL-E 3 model
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const urlData = response?.data?.[0]?.url;
    const b64Data = response?.data?.[0]?.b64_json;

    let finalImageUrl = urlData;
    if (!finalImageUrl && b64Data) {
      finalImageUrl = `data:image/png;base64,${b64Data}`;
    }

    if (!finalImageUrl) {
      return res.status(500).json({ error: 'Geen afbeelding ontvangen van OpenAI' });
    }

    return res.status(200).json({
      message: 'Image improved successfully',
      improvedImage: finalImageUrl,
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