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
    // --- CONTROLEER OF OPENAI KEY AANWEZIG IS (.env.local fallback) ---
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

    // Zorg voor veilige verwerking van de body
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { room, analysis, visualDescription } = body || {};
    const roomDesc = visualDescription || analysis || '';

    // Kamernaam vertalen
    const roomTranslations = {
      keuken: "kitchen",
      woonkamer: "living room",
      slaapkamer: "bedroom",
      badkamer: "bathroom",
      kantoor: "office",
      zolder: "attic",
      gang: "hallway"
    };

    const rawRoom = room ? room.toLowerCase().trim() : "room";
    const englishRoom = roomTranslations[rawRoom] || rawRoom;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Schoon de tekst op voor DALL-E
    const cleanDescription = String(roomDesc).replace(/[*#]/g, '').slice(0, 1000);

    const prompt = `A realistic photo of the EXACT SAME ${englishRoom}, completely clean, decluttered, and organized.

CRITICAL VISUAL REQUIREMENTS:
1. ROOM DETAILS & COLORS: Keep exact colors, cabinets, finishes, countertops, flooring, and appliances described here: "${cleanDescription}".
2. ARCHITECTURE & LAYOUT: Keep the exact same room structure and cabinet layout intact.
3. DECLUTTER ONLY: Remove all trash, loose clutter, dirty dishes, and mess.
4. Lighting should be bright, warm, clean, and photorealistic.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    const imageUrl = response.data[0]?.url || response.data[0]?.b64_json;

    if (!imageUrl) {
      throw new Error('Geen afbeelding ontvangen van OpenAI');
    }

    return res.status(200).json({
      improvedImage: imageUrl
    });

  } catch (error) {
    console.error('Improve error:', error.message);
    return res.status(500).json({
      error: 'Improve failed',
      details: error.message,
    });
  }
};

module.exports = handler;
module.exports.config = config;