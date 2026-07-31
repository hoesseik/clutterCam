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
    // 1. Fallback om .env.local direct te lezen als process.env leeg is (voor lokaal testen)
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

    const { room } = req.body || {};

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `A clean, perfectly organized, tidy and beautiful ${room || "room"}. No clothes on the floor or bed, no mess, well-lit modern interior photography, professional interior design.`;

    const response = await openai.images.generate({
      model: "gpt-4-turbo",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response?.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Geen afbeelding ontvangen van OpenAI' });
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