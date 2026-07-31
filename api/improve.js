import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { analysis, room } = req.body;

        const prompt = `A clean, perfectly organized, tidy and beautiful ${room || "room"}. No clothes on the floor or bed, no mess, well-lit modern interior photography. Context: ${analysis || "tidy room"}`;

        const response = await openai.images.generate({
            model: "gpt-image-1.5",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        // Haal de gegenereerde URL of Base64 op uit de OpenAI response
        const imageUrl = response?.data?.[0]?.url || response?.data?.[0]?.b64_json;

        if (!imageUrl) {
            return res.status(500).json({ error: "Geen afbeelding URL ontvangen van OpenAI" });
        }

        // Stuur expliciet 'improvedImage' terug naar de frontend
        return res.status(200).json({
            message: "Image improved successfully",
            improvedImage: imageUrl
        });

    } catch (error) {
        console.error("Error in /api/improve:", error);
        return res.status(500).json({ error: error.message || "Failed to generate improved image" });
    }
}