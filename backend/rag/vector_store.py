"""
GymRat AI — ChromaDB Vector Store Wrapper
Manages vector embeddings for fitness knowledge retrieval.
"""

import os
from typing import Optional

import chromadb
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from .pdf_processor import DocumentChunk


class VectorStore:
    """Wrapper around ChromaDB for fitness knowledge vector storage."""

    def __init__(
        self,
        persist_directory: str = "./data/chroma",
        collection_name: str = "fitness_knowledge",
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
    ):
        self.persist_directory = persist_directory
        self.collection_name = collection_name

        # Initialize embedding model (free, runs locally)
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )

        # Initialize ChromaDB client
        os.makedirs(persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=persist_directory)

        # LangChain Chroma wrapper for easy retrieval
        self.vectorstore = Chroma(
            client=self.client,
            collection_name=collection_name,
            embedding_function=self.embeddings,
        )

    def add_documents(self, chunks: list[DocumentChunk]) -> int:
        """Add document chunks to the vector store. Returns count added."""
        if not chunks:
            return 0

        texts = [chunk.content for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]

        self.vectorstore.add_texts(
            texts=texts,
            metadatas=metadatas,
        )

        return len(texts)

    def similarity_search(
        self,
        query: str,
        k: int = 5,
        filter_dict: Optional[dict] = None,
    ) -> list[dict]:
        """
        Search for similar documents.
        Returns list of {content, metadata, score} dicts.
        """
        results = self.vectorstore.similarity_search_with_score(
            query=query,
            k=k,
            filter=filter_dict,
        )

        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
            }
            for doc, score in results
        ]

    def as_retriever(self, k: int = 5):
        """Return a LangChain retriever for use in RAG chains."""
        return self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k},
        )

    def get_collection_stats(self) -> dict:
        """Get statistics about the vector store collection."""
        try:
            col = self.client.get_or_create_collection(self.collection_name)
            count = col.count()
            return {
                "collection_name": self.collection_name,
                "document_count": count,
                "persist_directory": self.persist_directory,
            }
        except Exception:
            return {
                "collection_name": self.collection_name,
                "document_count": 0,
                "persist_directory": self.persist_directory,
            }

    def delete_collection(self) -> None:
        """Delete the entire collection."""
        try:
            self.client.delete_collection(self.collection_name)
            print(f"Deleted collection: {self.collection_name}")
        except Exception as e:
            print(f"Error deleting collection: {e}")
