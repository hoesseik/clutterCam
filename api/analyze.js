const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Vercel instructie: schakel de standaard body-parser uit voor file uploads (indien nodig)
const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async function (req, res) {
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
    // 2. Probeer OPENAI_API_KEY uit process.env te halen, en fallback naar .env.local als die bestaat
    if (!process.env.OPENAI_API_KEY) {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
          if (match && match[1]) {
            // Verwijder optionele quotes en whitespace, maar log nooit de key zelf
            process.env.OPENAI_API_KEY = match[1].trim().replace(/^"|"$/g, '');
            console.log('OPENAI_API_KEY geladen uit .env.local (redacted).');
          } else {
            console.log('.env.local gevonden maar OPENAI_API_KEY niet aanwezig in dat bestand.');
          }
        } catch (e) {
          console.log('Fout bij lezen van .env.local:', e.message);
        }
      } else {
        console.log('.env.local niet gevonden in projectroot.');
      }
    }

    // 3. Controleer nogmaals of de key aanwezig is
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is niet ingesteld in Vercel Environment Variables of .env.local.');
    }

    // 4. (Optioneel) OpenAI client initialiseren — niet nodig voor mock response,
    // maar klaar om te gebruiken zodra je echte analyse wilt doen.
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 5. Tijdelijke test-respons om te verifiëren dat de verbinding werkt
    const id = Date.now().toString();
    const mockAnalysis = 'Kamer geanalyseerd: Er liggen spullen op de tafel die opgeruimd kunnen worden.';

    return res.status(200).json({
      id,
      analysis: mockAnalysis,
    });
  } catch (error) {
    console.error('Analyze error:', error.message);
    return res.status(500).json({
      error: 'Analyze failed',
      details: error.message,
    });
  }
};

module.exports = handler;
module.exports.config = config;
