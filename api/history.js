module.exports = async function handler(req, res) {
  // 1. Zorg dat je frontend (ook op andere domeinen/localhost) deze data mag ophalen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Optionele 'preflight' van de browser afhandelen
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Mock history data
    const history = [
      { id: 1, action: "analyze", date: "2026-07-29" },
      { id: 2, action: "improve", date: "2026-07-29" }
    ];

    // Vercel verwacht de response zo terug te krijgen
    return res.status(200).json({ items: history });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};