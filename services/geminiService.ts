
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Moderate content for global rooms.
   */
  async moderateContent(content: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following message for hate speech, extreme toxicity, or spam. Respond in JSON format.
        Message: "${content}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isHarmful: { type: Type.BOOLEAN, description: "Whether the content is harmful." },
              reason: { type: Type.STRING, description: "Brief reason if harmful." },
              suggestions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Smart reply suggestions for this message if it's safe."
              }
            },
            required: ["isHarmful", "suggestions"]
          }
        }
      });
      
      const resText = response.text || '{"isHarmful": false, "suggestions": []}';
      return JSON.parse(resText);
    } catch (error) {
      console.error("Gemini moderation error:", error);
      return { isHarmful: false, suggestions: [] };
    }
  }

  /**
   * Generate a clan banner description or icon idea based on prompt.
   */
  async generateClanAssets(prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality gaming clan banner for a group named ${prompt}. Cinematic, neon accents, futuristic.` }]
        },
        config: {
            imageConfig: {
                aspectRatio: "16:9"
            }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image generation error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
