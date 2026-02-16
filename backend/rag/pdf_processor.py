"""
GymRat AI — PDF Text Extraction & Chunking Module
Processes fitness PDFs into document chunks for vector embedding.
"""

import os
import re
from typing import Optional
from dataclasses import dataclass, field

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter


@dataclass
class DocumentChunk:
    """A chunk of text extracted from a PDF with metadata."""

    content: str
    metadata: dict = field(default_factory=dict)


class PDFProcessor:
    """Extract and chunk text from PDF files for RAG ingestion."""

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " "],
            length_function=len,
        )

    def load_pdf(self, filepath: str) -> list[str]:
        """Load a PDF and return a list of page texts."""
        reader = PdfReader(filepath)
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return pages

    def clean_text(self, text: str) -> str:
        """Clean extracted text: normalize whitespace, remove artifacts."""
        # Remove excessive whitespace
        text = re.sub(r"\s+", " ", text)
        # Remove page numbers (standalone digits on their own line)
        text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
        # Normalize unicode characters
        text = text.encode("ascii", "ignore").decode("ascii")
        return text.strip()

    def chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping chunks."""
        return self.text_splitter.split_text(text)

    def extract_metadata(self, filepath: str) -> dict:
        """Extract PDF metadata (title, author, pages)."""
        reader = PdfReader(filepath)
        info = reader.metadata
        return {
            "source": os.path.basename(filepath),
            "title": info.title if info and info.title else os.path.basename(filepath),
            "author": info.author if info and info.author else "Unknown",
            "total_pages": len(reader.pages),
        }

    def process_pdf(
        self,
        filepath: str,
        category: str = "general",
    ) -> list[DocumentChunk]:
        """
        Full processing pipeline for a single PDF.
        Returns a list of DocumentChunks with metadata.
        """
        pages = self.load_pdf(filepath)
        metadata = self.extract_metadata(filepath)
        chunks: list[DocumentChunk] = []

        for page_num, page_text in enumerate(pages, start=1):
            cleaned = self.clean_text(page_text)
            if not cleaned:
                continue

            page_chunks = self.chunk_text(cleaned)

            for chunk_idx, chunk_content in enumerate(page_chunks):
                chunk = DocumentChunk(
                    content=chunk_content,
                    metadata={
                        **metadata,
                        "page": page_num,
                        "chunk_index": chunk_idx,
                        "category": category,
                    },
                )
                chunks.append(chunk)

        return chunks

    def process_directory(
        self,
        directory: str,
        category: str = "general",
    ) -> list[DocumentChunk]:
        """Process all PDFs in a directory."""
        all_chunks: list[DocumentChunk] = []

        for filename in os.listdir(directory):
            if filename.lower().endswith(".pdf"):
                filepath = os.path.join(directory, filename)
                try:
                    chunks = self.process_pdf(filepath, category)
                    all_chunks.extend(chunks)
                    print(f"  ✓ Processed {filename}: {len(chunks)} chunks")
                except Exception as e:
                    print(f"  ✗ Failed to process {filename}: {e}")

        return all_chunks
