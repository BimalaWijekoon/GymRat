"""
GymRat AI — RAG System Tests
"""

import pytest


class TestRAGSystem:
    """Test the RAG system components."""

    test_queries = [
        "What is a good workout plan for beginners?",
        "How much protein should I eat for muscle gain?",
        "What exercises target the chest?",
        "How do I prevent lower back pain during deadlifts?",
    ]

    def test_pdf_processor_import(self):
        """Test that PDFProcessor can be imported."""
        from rag.pdf_processor import PDFProcessor
        processor = PDFProcessor()
        assert processor is not None

    def test_pdf_processor_clean_text(self):
        """Test text cleaning."""
        from rag.pdf_processor import PDFProcessor
        processor = PDFProcessor()

        dirty_text = "  Hello   World  \n  123  \n  Test  "
        cleaned = processor.clean_text(dirty_text)
        assert "  " not in cleaned  # No double spaces
        assert cleaned  # Not empty

    def test_pdf_processor_chunk_text(self):
        """Test text chunking."""
        from rag.pdf_processor import PDFProcessor
        processor = PDFProcessor(chunk_size=100, chunk_overlap=20)

        long_text = "This is a test sentence. " * 50
        chunks = processor.chunk_text(long_text)
        assert len(chunks) > 1
        assert all(len(chunk) <= 200 for chunk in chunks)  # Allow some overflow

    def test_vector_store_import(self):
        """Test that VectorStore can be imported."""
        from rag.vector_store import VectorStore
        assert VectorStore is not None

    def test_rag_chain_import(self):
        """Test that RAGChain can be imported."""
        from rag.rag_chain import RAGChain
        assert RAGChain is not None


class TestAPI:
    """Test the FastAPI endpoints."""

    def test_app_import(self):
        """Test that the FastAPI app can be imported."""
        from api.main import app
        assert app is not None

    def test_chat_request_model(self):
        """Test ChatRequest validation."""
        from api.main import ChatRequest

        # Valid request
        req = ChatRequest(query="test question", user_id="user123")
        assert req.query == "test question"
        assert req.user_id == "user123"

        # Invalid: empty query
        with pytest.raises(Exception):
            ChatRequest(query="", user_id="user123")

    def test_health_response_model(self):
        """Test HealthResponse model."""
        from api.main import HealthResponse

        resp = HealthResponse(status="ok", version="1.0.0")
        assert resp.status == "ok"
        assert resp.version == "1.0.0"
