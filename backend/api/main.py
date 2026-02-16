"""
GymRat AI — FastAPI Backend
REST API for RAG-powered fitness coaching chat.
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

# ============================================
# RAG Chain Singleton (lazy initialization)
# ============================================

rag_chain = None


def get_rag_chain():
    """Lazy-initialize the RAG chain."""
    global rag_chain
    if rag_chain is None:
        from rag.rag_chain import RAGChain
        rag_chain = RAGChain()
    return rag_chain


# ============================================
# App Lifespan
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("🏋️ GymRat AI Backend starting up...")
    yield
    print("🏋️ GymRat AI Backend shutting down...")


# ============================================
# FastAPI App
# ============================================

app = FastAPI(
    title="GymRat AI API",
    description="RAG-powered fitness coaching API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Request / Response Models
# ============================================


class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""
    query: str = Field(..., min_length=1, max_length=2000, description="The user's question")
    user_id: str = Field(..., min_length=1, description="Firebase user ID")
    context: Optional[str] = Field(None, description="Optional user context (recent workouts, goals)")
    mode: str = Field("coach", description="Chat mode: 'coach' (RAG) or 'gemini' (direct LLM)")


class ChatSource(BaseModel):
    """A source document referenced in the response."""
    title: str
    page: Optional[int] = None
    snippet: str
    category: str = "general"


class ChatResponse(BaseModel):
    """Response from the chat endpoint."""
    response: str
    sources: list[ChatSource] = []
    timestamp: str


class HealthResponse(BaseModel):
    """Response from the health endpoint."""
    status: str
    version: str
    document_count: int = 0
    model: str = "gemini-1.5-flash"


# ============================================
# Endpoints
# ============================================


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check if the API and RAG system are operational."""
    try:
        chain = get_rag_chain()
        health = chain.health_check()
        return HealthResponse(
            status=health["status"],
            version="1.0.0",
            document_count=health["document_count"],
            model=health["model"],
        )
    except Exception as e:
        return HealthResponse(
            status=f"error: {str(e)}",
            version="1.0.0",
        )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """
    Send a fitness question to the RAG-powered AI coach.
    """
    try:
        chain = get_rag_chain()

        # Enhance query with user context if provided
        enhanced_query = body.query
        if body.context:
            enhanced_query = f"User context: {body.context}\n\nQuestion: {body.query}"

        # Route by mode
        if body.mode == "gemini":
            result = chain.query_direct(enhanced_query)
        else:
            result = chain.query(enhanced_query)

        return ChatResponse(
            response=result["response"],
            sources=[ChatSource(**s) for s in result["sources"]],
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat request: {str(e)}",
        )


# ============================================
# Run with: uvicorn main:app --reload --port 8000
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
