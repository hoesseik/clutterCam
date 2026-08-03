const handler = async function (req, res) {
  try {
    // Haal de scans op uit het geheugen
    const history = global.historyStore || [];

    const totalScans = history.length;

    // 1. Bereken de meest gescande kamer
    const roomCounts = {};
    history.forEach(item => {
      if (item.room) {
        const roomName = item.room.toLowerCase();
        roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
      }
    });

    let mostScannedRoom = "-";
    let maxCount = 0;
    for (const [room, count] of Object.entries(roomCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostScannedRoom = room;
      }
    }

    // 2. Pak de meest recente scan (de laatste in de array)
    const lastScan = history.length > 0 ? history[history.length - 1] : null;

    // 3. Geef alle opgevraagde profielgegevens terug
    return res.status(200).json({
      name: "Hoessein",
      totalScans: totalScans,
      mostScannedRoom: mostScannedRoom,
      lastScan: lastScan,
      scoresByRoom: {},
      trend: [],
      bestScan: null,
      worstScan: null
    });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

module.exports = handler;