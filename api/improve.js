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
    const { room } = req.body || {};

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `A clean, perfectly organized, tidy and beautiful ${room || "room"}. No clothes on the floor or bed, no mess, well-lit modern interior photography, professional interior design.`;

    const response = await openai.images.generate({
      model: "gpt-image-1", // <--- Aangepast naar het model uit jouw lijst
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