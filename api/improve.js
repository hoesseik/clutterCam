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

        // Laat DALL-E 3 een schone/opgeruimde versie tekenen op basis van de kamer en analyse
        const prompt = `A clean, perfectly organized, tidy and beautiful ${room || "room"}. No clothes on the floor or bed, no mess, well-lit modern interior photography. Context: ${analysis || "tidy room"}`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
        });

        const newImageBase64 = response.data[0].b64_json;

        return res.status(200).json({
            message: "Image improved successfully",
            improvedImage: `data:image/png;base64,${newImageBase64}`
        });

    } catch (error) {
        console.error("Error in /api/improve:", error);
        return res.status(500).json({ error: "Failed to generate improved image" });
    }
}