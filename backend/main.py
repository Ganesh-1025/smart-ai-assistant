import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables")

# Create Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# FastAPI app
app = FastAPI(title="Smart AI Assistant API", version="1.0.0")

# CORS (allow Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Mode System Prompts
# -------------------------

MODE_PROMPTS = {
    "chat": (
        "You are Smart AI Assistant, a helpful and friendly AI. "
        "Answer clearly and concisely. Use markdown formatting when helpful."
    ),
    "summarize": (
        "You are an expert text summarizer. Provide:\n"
        "1. TL;DR\n"
        "2. Bullet point key ideas\n"
        "3. Key takeaway."
    ),
    "explain": (
        "You are an expert technical teacher.\n"
        "Explain concepts in simple language, then deeper explanation.\n"
        "Provide examples when helpful."
    ),
    "code": (
        "You are a senior software engineer.\n"
        "Write clean production-level code.\n"
        "Always use code blocks and explain briefly."
    ),
}

# -------------------------
# Request Models
# -------------------------

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    mode: str = "chat"
    history: Optional[List[Message]] = []


# -------------------------
# Health Check
# -------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "model": "gemini-2.5-flash"}


# -------------------------
# Chat Endpoint
# -------------------------

@app.post("/chat")
async def chat(request: ChatRequest):

    mode = request.mode if request.mode in MODE_PROMPTS else "chat"
    system_prompt = MODE_PROMPTS[mode]

    # Build conversation
    contents = []

    contents.append(system_prompt)

    if request.history:
        for msg in request.history:
            contents.append(f"{msg.role}: {msg.content}")

    contents.append(f"user: {request.message}")

    async def stream_response():
        try:
            response = client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=contents,
            )

            for chunk in response:
                if chunk.text:
                    data = json.dumps({
                        "text": chunk.text,
                        "done": False
                    })
                    yield f"data: {data}\n\n"

            yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"

        except Exception as e:
            error_data = json.dumps({
                "error": str(e),
                "done": True
            })
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@app.get("/")
def home():
    return {"message": "Smart AI Assistant API is running"}