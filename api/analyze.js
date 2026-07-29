const { OpenAI } = require('openai');

// Vercel instructie: schakel de standaard body-parser uit voor file uploads (indien nodig)
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  // 1. CORS Headers inschakelen
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
    // 2. Controleer of de OpenAI API Key aanwezig is
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is niet ingesteld in Vercel Environment Variables.");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 3. Tijdelijke test-respons om te verifiëren dat de verbinding werkt
    // (Zodra dit werkt, koppelen we de afbeelding-analyse hieraan)
    const id = Date.now().toString();
    const mockAnalysis = "Kamer geanalyseerd: Er liggen spullen op de tafel die opgeruimd kunnen worden.";

    return res.status(200).json({
      id: id,
      analysis: mockAnalysis
    });

  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({ 
      error: "Analyze failed", 
      details: error.message 
    });
  }
};
