const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Vercel instructie: verhoog de body-parser limiet voor grote base64 afbeeldingen
const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
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
    // 2. Probeer OPENAI_API_KEY uit process.env te halen, en fallback naar .env.local
    if (!process.env.OPENAI_API_KEY) {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
          if (match && match[1]) {
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

    // 4. Afbeelding uit de request body halen
    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen in de body' });
    }

    const formattedImage = image.startsWith('data:') 
      ? image 
      : `data:image/jpeg;base64,${image}`;

    // 5. OpenAI client initialiseren
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 6. Echte Vision Analyse uitvoeren
    // 6. Echte Vision Analyse uitvoeren
    const response = await openai.chat.completions.create({
      model: "gpt-image-1.5", // of het model dat je nu gekozen hebt
      messages: [
        {
          role: "system",
          content: `Je bent een professionele opruim- en organisatie-expert. 
Analyseer de foto van de kamer grondig en geef een uitgebreid, helder en motiverend opruimadvies.

Structureer je antwoord ALTIJD in de volgende onderdelen:

📍 **Type ruimte**: [bijv. Slaapkamer, Bureau, Woonkamer]
🧹 **Status van de kamer**: [In 1-2 zinnen een korte samenvatting van wat er ligt]

📋 **Concreet Stappenplan**:
1. **[Stap 1: Afval & Vaat]**: ...
2. **[Stap 2: Kleding]**: ...
3. **[Stap 3: Oppervlakken]**: ...
4. **[Stap 4: Ordenen & Opbergen]**: ...
5. **[Stap 5: Laatste puntjes op de i]**: ...

Houd de toon vriendelijk, praktisch, to-the-point en direct uitvoerbaar. Gebruik duidelijke opmaak met opsommingstekens.`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyseer deze kamer en geef een gedetailed opruimadvies met concrete stappen." 
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
      max_completion_tokens: 600 // <--- VERANDERD VAN max_tokens NAAR max_completion_tokens!
    });

    const analysisText = response.choices[0].message.content;

    // 7. Geef de echte analyse terug
    return res.status(200).json({
      id: Date.now().toString(),
      analysis: analysisText,
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
