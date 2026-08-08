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

    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen in de body' });
    }

    const formattedImage = image.startsWith('data:') 
      ? image 
      : `data:image/jpeg;base64,${image}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Vraag GPT-4 Vision om ZOWEL opruimadvies ALS een gedetailleerde visuele beschrijving in JSON
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Je bent een opruimexpert én een professionele interieurarchitect.
Analyseer de foto van de kamer grondig en geef verplicht een antwoord in JSON formaat met exact twee velden: "advice" en "visual_description".

1. "advice": Het opruimadvies in het Nederlands voor de gebruiker. Structureer als:
📍 **Type ruimte**: [Slaapkamer, Keuken, Woonkamer, etc.]
🧹 **Status van de kamer**: [Korte samenvatting]

📋 **Concreet Stappenplan**:
1. **[Stap 1: Afval & Vaat]**: ...
2. **[Stap 2: Kleding/Spullen]**: ...
3. **[Stap 3: Oppervlakken]**: ...
4. **[Stap 4: Ordenen & Opbergen]**: ...
5. **[Stap 5: Laatste puntjes op de i]**: ...

2. "visual_description": Een zéér gedetailleerde Engelse visuele beschrijving van de ARCHITECTUUR, MATERIALEN, KLEUREN en UNIEKE DECORATIES van de ruimte (ZONDER de losse rommel).
Beschrijf expliciet:
- Exacte kleuren en materialen van kasten/meubels (bijv. "dark charcoal blue wooden cabinets", "concrete plaster wall").
- Specifieke wanddecoratie en details (bijv. "mounted taxidermy ram head on the right wall", "wooden rack with hanging stainless steel kitchen tools").
- Apparaten, verlichting en vloeren (bijv. "freestanding stainless steel stove", "rustic wooden stool").
Dit veld dient als directe prompt voor een afbeeldingsgenerator om DEZELFDE kamer in opgeruimde staat te tekenen.`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyseer deze kamer en geef de JSON output met opruimadvies en visuele beschrijving." 
            },
            {
              type: "image_url",
              image_url: {
                url: formattedImage
              }
            }
          ]
        }
      ],
      max_completion_tokens: 1000
    });

    const jsonString = response.choices[0].message.content;
    let parsedData = {};
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      parsedData = {
        advice: jsonString,
        visual_description: ""
      };
    }

    return res.status(200).json({
      id: Date.now().toString(),
      analysis: parsedData.advice || "",
      visualDescription: parsedData.visual_description || ""
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