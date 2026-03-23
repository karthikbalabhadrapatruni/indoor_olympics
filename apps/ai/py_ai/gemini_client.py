import json
import re
import time
from google import genai
from .config import (
    get_ai_initial_backoff_ms,
    get_ai_retry_count,
    get_gemini_api_key,
    get_reasoning_model,
    get_text_model,
)


class GeminiClient:
    def __init__(self):
        self.client = genai.Client(api_key=get_gemini_api_key())

    def generate_text(self, prompt: str, use_reasoning: bool = False) -> str:
        model = get_reasoning_model() if use_reasoning else get_text_model()
        last_error = None
        retries = max(get_ai_retry_count(), 1)
        backoff_ms = max(get_ai_initial_backoff_ms(), 200)

        for attempt in range(retries):
            try:
                response = self.client.models.generate_content(model=model, contents=prompt)
                return (response.text or "").strip()
            except Exception as exc:
                last_error = exc
                if attempt == retries - 1:
                    break
                time.sleep((backoff_ms / 1000.0) * (2 ** attempt))

        raise last_error

    def generate_json(self, prompt: str, use_reasoning: bool = False) -> dict:
        text = self.generate_text(prompt, use_reasoning=use_reasoning)
        fenced = re.search(r"```json\s*(.*?)```", text, re.DOTALL)
        candidate = fenced.group(1).strip() if fenced else text.strip()
        return json.loads(candidate)
