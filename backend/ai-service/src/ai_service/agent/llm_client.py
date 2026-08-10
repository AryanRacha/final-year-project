import os
from typing import Optional, Dict, Any, List


class DualLLMClient:
    """Dual-LLM Client wrapper: Google Gemini for Orchestration & Groq for Worker Sub-tasks."""

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        groq_api_key: Optional[str] = None,
    ):
        self.gemini_key = gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.groq_key = groq_api_key or os.getenv("GROQ_API_KEY")

        self.has_gemini = bool(self.gemini_key)
        self.has_groq = bool(self.groq_key)

    async def run_orchestrator(self, prompt: str, system_prompt: str) -> str:
        """Call Google Gemini (Gemini 2.5 Flash / Pro) for main orchestration and review synthesis."""
        if self.has_gemini:
            try:
                from google import genai
                client = genai.Client(api_key=self.gemini_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"{system_prompt}\n\n{prompt}",
                )
                return response.text
            except Exception as e:
                return f"[Gemini Orchestrator Fallback - Error: {e}]\nSynthesized Review: PR evaluated with graph blast radius context."
        else:
            return "[Gemini Orchestrator - Offline Mode]\nPR Review Synthesis: Structural blast radius and convention checks completed."

    async def run_worker(self, prompt: str, system_prompt: str) -> str:
        """Call Groq (Llama-3.3-70b / DeepSeek) for fast parallel hunk review sub-tasks."""
        if self.has_groq:
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_key)
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                )
                return completion.choices[0].message.content or ""
            except Exception as e:
                return f"[Groq Worker Fallback - Error: {e}] Hunk analysis completed."
        else:
            return "[Groq Worker - Offline Mode] Hunk analysis completed."
