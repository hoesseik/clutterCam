export default async function handler(req, res) {
  try {
    // 1. Zorg dat de body veilig gelezen/geparsed wordt
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    // 2. Gebruik optional chaining om te voorkomen dat req.body crasht als het undefined is
    const image = body?.image;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    res.status(200).json({
      message: "Image improved successfully",
      improvedImage: image // hier komt later jouw echte verbeterde foto
    });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
}
