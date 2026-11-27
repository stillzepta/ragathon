"""Model provider compatibility layer with Gemini → Groq fallback."""

import os


class ModelProvider:
    def __init__(self) -> None:
        self.provider = os.getenv("MODEL_PROVIDER", "mock")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.groq_key = os.getenv("GROQ_API_KEY", "")

    def _generate_gemini(self, system: str, prompt: str) -> str:
        if not self.gemini_key:
            return ""
        try:
            from google import genai

            client = genai.Client(api_key=self.gemini_key)
            response = client.models.generate_content(
                model=os.getenv("MODEL_NAME", "gemini-2.5-flash"),
                contents=f"SYSTEM:\n{system}\n\nUSER:\n{prompt}",
            )
            return response.text or ""
        except Exception:
            return ""

    def _generate_groq(self, system: str, prompt: str) -> str:
        if not self.groq_key:
            return ""
        try:
            import httpx

            response = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.groq_key}"},
                json={
                    "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                },
                timeout=30,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception:
            return ""

    def generate(self, system: str, prompt: str) -> str:
        if self.provider == "gemini":
            answer = self._generate_gemini(system, prompt)
            return answer or self._generate_groq(system, prompt)
        if self.provider == "groq":
            return self._generate_groq(system, prompt)
        return ""

