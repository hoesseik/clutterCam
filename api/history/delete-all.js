const handler = async function (req, res) {
  return res.status(200).json({ 
    success: true, 
    message: "All history deleted" 
  });
};

module.exports = handler;