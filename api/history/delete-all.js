const handler = async function (req, res) {
  res.status(200).json({ message: "All history deleted" });
};

module.exports = handler;