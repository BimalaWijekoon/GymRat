"""
GymRat AI — RAG Chain with Google Gemini
LangChain RetrievalQA chain for fitness coaching responses.
"""

import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate

from .vector_store import VectorStore

load_dotenv()

# ============================================
# Fitness Coaching Prompt Template
# ============================================

COACHING_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are GymRat AI — an expert fitness coach, personal trainer, and sports nutritionist.
You provide evidence-based advice grounded in exercise science and sports nutrition research.

Use the following retrieved context to answer the user's question. If the context contains
relevant information, use it and cite the source. If the context doesn't fully answer the
question, supplement with your general fitness knowledge but be transparent about it.

CONTEXT:
{context}

USER'S QUESTION:
{question}

GUIDELINES:
- Be encouraging, supportive, and motivating
- Provide specific, actionable advice
- Include sets, reps, and weight recommendations when relevant
- Mention safety precautions and proper form tips
- If asked about injuries or medical conditions, recommend consulting a professional
- Format workout plans clearly with days, exercises, sets, and reps
- When suggesting nutrition, give practical meal ideas with approximate macros

RESPONSE:""",
)


class RAGChain:
    """RAG chain combining ChromaDB retrieval with Google Gemini LLM."""

    def __init__(
        self,
        vector_store: VectorStore | None = None,
        model_name: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        top_k: int = 5,
    ):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GOOGLE_GEMINI_API_KEY not found in environment variables. "
                "Please set it in backend/.env"
            )

        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        # Initialize vector store
        chroma_path = os.getenv("CHROMADB_PATH", "./data/chroma")
        self.vector_store = vector_store or VectorStore(persist_directory=chroma_path)

        # Check if we have documents
        stats = self.vector_store.get_collection_stats()
        self._has_documents = stats["document_count"] > 0

        if self._has_documents:
            # Build the RetrievalQA chain
            self.chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_store.as_retriever(k=top_k),
                return_source_documents=True,
                chain_type_kwargs={
                    "prompt": COACHING_PROMPT,
                },
            )
        else:
            self.chain = None
            print("⚠️  No documents in vector store. RAG will use LLM-only mode.")
            print("   Run: python -m scripts.download_pdfs && python -m scripts.embed_pdfs")

    def query(self, question: str) -> dict:
        """
        Query the RAG chain with a fitness question.

        Returns:
            dict with 'response' (str) and 'sources' (list of dicts)
        """
        # If no documents, fall back to direct LLM
        if not self._has_documents or self.chain is None:
            return self._query_llm_only(question)

        try:
            result = self.chain.invoke({"query": question})

            # Extract source documents
            sources = []
            seen = set()
            for doc in result.get("source_documents", []):
                source_key = f"{doc.metadata.get('source', '')}-p{doc.metadata.get('page', '')}"
                if source_key not in seen:
                    seen.add(source_key)
                    sources.append(
                        {
                            "title": doc.metadata.get("source", "Unknown"),
                            "page": doc.metadata.get("page"),
                            "snippet": doc.page_content[:200] + "...",
                            "category": doc.metadata.get("category", "general"),
                        }
                    )

            return {
                "response": result.get("result", "I couldn't generate a response."),
                "sources": sources,
            }

        except Exception as e:
            # Fallback to LLM-only on retrieval errors
            print(f"⚠️  RAG retrieval error, falling back to LLM: {e}")
            return self._query_llm_only(question)

    def query_direct(self, question: str) -> dict:
        """Direct Gemini query without RAG context (public API)."""
        return self._query_llm_only(question)

    def _query_llm_only(self, question: str) -> dict:
        """Fallback: query Gemini directly without RAG context."""
        try:
            prompt = (
                "You are GymRat AI — an expert fitness coach. "
                "Provide helpful, evidence-based fitness advice.\n\n"
                f"Question: {question}\n\nResponse:"
            )
            response = self.llm.invoke(prompt)
            return {
                "response": response.content,
                "sources": [],
            }
        except Exception as e:
            return {
                "response": f"Sorry, I encountered an error: {str(e)}. Please try again.",
                "sources": [],
            }

    def health_check(self) -> dict:
        """Check if the RAG system is operational."""
        stats = self.vector_store.get_collection_stats()
        return {
            "status": "ok" if stats["document_count"] > 0 else "no_documents",
            "document_count": stats["document_count"],
            "model": "gemini-2.0-flash",
        }
