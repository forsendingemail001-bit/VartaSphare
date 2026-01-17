
import json
from js import window, console, GoogleGenAI
from bus import bus

class AIService:
    async def generate_replies(self, text):
        if not window.process.env.API_KEY: return []
        try:
            ai = GoogleGenAI.new({"apiKey": window.process.env.API_KEY})
            prompt = f"Analyze: '{text}'. Suggest 3 tactical gaming-style replies. JSON: {{\"replies\": [\"...\", \"...\", \"...\"]}}"
            response = await ai.models.generateContent({
                "model": "gemini-3-flash-preview",
                "contents": prompt,
                "config": {"responseMimeType": "application/json"}
            })
            replies = json.loads(response.text).get("replies", [])
            bus.publish("AI_SUGGESTIONS", replies)
        except Exception as e:
            console.warn(f"[AI] Gemini Error: {str(e)}")
