from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import requests
import os

app = FastAPI(title="Theo AI Backend")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

PRIMARY_MODEL = "google/gemma-3-27b-it:free"
FALLBACK_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

def call_llm(messages: List[Dict[str, str]], model: str = PRIMARY_MODEL) -> str:
    """Helper to call OpenRouter with a specific model."""
    if not OPENROUTER_API_KEY:
        return "ERROR: OPENROUTER_API_KEY not configured on backend."

    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://theoai.church",
            "X-Title": "Theo AI Frontend"
        },
        json={
            "model": model,
            "messages": messages
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return data["choices"][0]["message"]["content"]
    else:
        # Return error details so we can decide to fall back
        return f"HTTP_{response.status_code}: {response.text}"

def get_ai_response(messages: List[Dict[str, str]]) -> str:
    """Tries the primary model, falls back to the secondary if primary fails."""
    # Try Primary
    res = call_llm(messages, PRIMARY_MODEL)
    if not res.startswith("HTTP_"):
        return res
    
    # If primary failed (likely 429 or 500), try Fallback
    print(f"Primary model {PRIMARY_MODEL} failed, trying fallback {FALLBACK_MODEL}...")
    fallback_res = call_llm(messages, FALLBACK_MODEL)
    if not fallback_res.startswith("HTTP_"):
        return fallback_res
    
    # If both failed, raise the error
    raise HTTPException(status_code=500, detail=f"AI Provider error: {fallback_res}")

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    context: Dict[str, Any]

@app.post("/api/chat")
def chat(req: ChatRequest):
    system_prompt = f"""You are Theo AI Assistant, an AI embedded inside a live church media system.
Your role is to help users troubleshoot issues, guide live service operations clearly, and provide short, actionable responses.
You have access to the current system state. Use it to answer questions accurately.

CURRENT SYSTEM STATE:
- Mode: {req.context.get('mode', 'unknown')}
- Audio Status: {req.context.get('audioStatus', 'unknown')}
- Transcribing: {req.context.get('transcriptionStatus', 'unknown')}

Rules:
- Be concise (2-3 sentences max)
- Focus on solutions
- Assume the system is live in a church service
- If the user asks you to perform an action (e.g., "switch to sermon mode"), acknowledge it and return exactly YES_SWITCH_SERMON, YES_SWITCH_WORSHIP, or YES_SHOW_SCRIPTURE_[REF] on a separate line."""

    api_messages = [{"role": "system", "content": system_prompt}] + req.messages
    return {"response": get_ai_response(api_messages)}

class SummaryRequest(BaseModel):
    transcript: str

@app.post("/api/sermon-summary")
def summarize(req: SummaryRequest):
    system_prompt = """You are a theology assistant analyzing a church sermon transcript. 
Extract and generate the following in cleanly formatted markdown:
1. Title (A creative, fitting title for the sermon)
2. Key Passages (List any distinct scriptures or book references mentioned)
3. Theological Themes (2-3 core subjects discussed)
4. Synthesis (A 1-paragraph summary)"""

    api_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Transcript:\n{req.transcript}"}
    ]
    return {"summary": get_ai_response(api_messages)}

class BulkSongsRequest(BaseModel):
    content: str

@app.post("/api/bulk-songs")
def bulk_songs(req: BulkSongsRequest):
    system_prompt = """You are a professional music librarian for a church. Analyze the following text which contains a list of songs, setlists, or raw lyrics.
    TASK:
    1. EXTRACT: Find each individual song in the text.
    2. IDENTIFY: Determine the correct title for each song.
    3. CLEAN: Provide the full, clean lyrics. Remove chord notations or irrelevant metadata.
    4. STRUCTURE: Break the lyrics into logical verses/choruses.
    Return a JSON array of objects: [{"title": "...", "lyrics": "..."}]"""
    
    api_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.content}
    ]
    res = get_ai_response(api_messages)
    # Basic cleanup in case AI returns markdown blocks
    if "```json" in res:
        res = res.split("```json")[1].split("```")[0]
    elif "```" in res:
        res = res.split("```")[1].split("```")[0]
    
    import json
    try:
        songs = json.loads(res.strip())
        return {"songs": songs}
    except:
        return {"songs": [], "raw": res}

class AIProcessRequest(BaseModel):
    transcript: str
    mode: str

@app.post("/api/ai-process")
def ai_process(req: AIProcessRequest):
    system_prompt = f"""You are an elite AI church media assistant. 
    ANALYSIS MODE: {req.mode.upper()}
    TASK:
    1. SCRIPTURE: Identify quoted Bible verses.
    2. LYRICS: If worship music is detected, extract clean lyrics (2-4 lines).
    3. REJECTION: If general speech, return type "none".
    Respond ONLY with JSON: {{"type": "scripture"|"lyrics"|"none", "content": {{"reference": "...", "text": "...", "lines": ["..."]}}}}"""
    
    api_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.transcript}
    ]
    res = get_ai_response(api_messages)
    if "```json" in res:
        res = res.split("```json")[1].split("```")[0]
    elif "```" in res:
        res = res.split("```")[1].split("```")[0]
    
    import json
    try:
        return json.loads(res.strip())
    except:
        return {"type": "none", "error": "Invalid JSON from AI"}

@app.get("/")
def health():
    return {"status": "ok", "message": "Theo AI Hugging Face Backend (with Fallback) is running"}
