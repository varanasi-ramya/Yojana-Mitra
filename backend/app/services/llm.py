import httpx
import json
import logging
from typing import Optional
from app.core.config import settings

# Setting up logging
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Yojana Mitra, a helpful assistant for Telangana farmers.
Examine the provided documents and answer the question accurately based on the relevant scheme details.

User Context:
{context}

If the information is not explicitly in the documents, use your general knowledge about Telangana government schemes to provide a helpful answer, but clearly state that you are using general information.

Always provide a summary for scheme names like "Rythu Bima" or "Rythu Bharosa".

Answer in {language}.
"""

LANGUAGE_NAMES = {
    "en": "English",
    "te": "Telugu",
    "hi": "Hindi",
}

class LLMService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        # Names confirmed via list_models() in 2026 environment
        self.model_names = [
            "gemini-2.0-flash",
            "gemini-flash-lite-latest",
            "gemini-pro-latest",
            "gemini-flash-latest",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash"
        ]

    async def generate(self, query: str, context_docs: str, language: str, user_context: dict) -> Optional[str]:
        # ... [previous code omited for brevity, keeping same logic but fixing fallback detection]
        # (Actually I will provide the whole method to be safe)
        context_str = ""
        if user_context.get("district"):
            context_str += f"- Farmer's district: {user_context['district']}\n"
        if user_context.get("land_acres"):
            context_str += f"- Land owned: {user_context['land_acres']} acres\n"
        
        if not context_str:
            context_str = "No specific farmer context provided."

        system = SYSTEM_PROMPT.format(
            language=LANGUAGE_NAMES.get(language, "English"),
            context=context_str
        )

        prompt_text = f"""
{system}

Relevant scheme information from official documents:
-----------------------------------------
{context_docs}
-----------------------------------------

Farmer's question: {query}

Please provide a helpful, accurate, and empathetic answer in {LANGUAGE_NAMES.get(language, "English")}.
"""

        last_err = ""
        for model in self.model_names:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt_text}]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": settings.MAX_TOKENS,
                    }
                }

                auth_headers = [
                    {"x-goog-api-key": self.api_key},
                    {"Authorization": f"Bearer {self.api_key}"}
                ]
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    for headers_auth in auth_headers:
                        headers = {"Content-Type": "application/json"}
                        headers.update(headers_auth)
                        
                        try:
                            response = await client.post(url, json=payload, headers=headers)
                            
                            if response.status_code == 200:
                                data = response.json()
                                try:
                                    return data['candidates'][0]['content']['parts'][0]['text']
                                except (KeyError, IndexError):
                                    continue
                            
                            if response.status_code == 401:
                                continue
                                
                            error_msg = response.text
                            last_err = f"{model} ({response.status_code}): {error_msg[:100]}"
                            break 

                        except Exception:
                            continue

            except Exception as e:
                last_err = str(e)
                continue

        # Return None to signal RAG service to use direct search fallback
        logger.warning(f"LLM generation failed for all models. Last error: {last_err}")
        return None

llm_service = LLMService()
