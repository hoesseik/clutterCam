const handler = async function (req, res) {
  try {
    return res.status(200).json({
      name: "Hoessein",
      version: "1.0",
      app: "ClutterCam"
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

module.exports = handler;
