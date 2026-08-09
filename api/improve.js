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

// --- RATE LIMITER INSTELLINGEN (Max 5 verzoeken per IP per uur) ---
const requestCounts = new Map();
const LIMIT = 5;
const TIMEFRAME = 60 * 60 * 1000; // 1 uur

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequest = requestCounts.get(ip);

  if (!userRequest) {
    requestCounts.set(ip, { count: 1, firstRequest: now });
    return true;
  }

  if (now - userRequest.firstRequest > TIMEFRAME) {
    requestCounts.set(ip, { count: 1, firstRequest: now });
    return true;
  }

  if (userRequest.count >= LIMIT) {
    return false;
  }

  userRequest.count++;
  return true;
}

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

  // --- CONTROLEER RATE LIMIT ---
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Te veel aanvragen. Probeer het over een uur nog eens.' });
  }

  try {
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

const { room, analysis } = req.body || {};

// 1. Vertaal kamertype naar Engels voor maximale DALL-E precisie
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

// 2. Gecombineerde Engelse prompt (kamer + analyse verplicht samen)
const prompt = `A highly realistic, beautifully organized, and clean photo of a ${englishRoom}.

STRICT REQUIREMENTS:
1. The output MUST clearly be a ${englishRoom}. Do not change the type of room.
2. Base the layout on this description: "${analysis || 'A messy ' + englishRoom}".
3. Keep the existing architecture, wall colors, layout, and large furniture intact.
4. Do NOT add unwanted structural elements (like wooden ceiling beams or slanted roofs) unless specified.
5. Remove ALL clutter, trash, loose papers, bottles, and mess. Make the room perfectly neat and brightly lit.`;
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