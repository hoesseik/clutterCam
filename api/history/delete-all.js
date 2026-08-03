const handler = async function (req, res) {
  try {
    // Leeg het centrale geheugen waar de geschiedenis in staat
    global.historyStore = [];

    return res.status(200).json({ 
      success: true, 
      message: "All history deleted" 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = handler;