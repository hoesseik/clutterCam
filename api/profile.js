const handler = async function (req, res) {
  try {
    return res.status(200).json({
      name: "Hoessein",
      totalScans: 0,
      mostScannedRoom: "-",
      lastScan: null,
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