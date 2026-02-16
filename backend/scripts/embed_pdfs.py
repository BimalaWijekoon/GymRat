"""
GymRat AI — PDF Embedding Pipeline
Processes all PDFs and stores embeddings in ChromaDB.

Usage:
    cd backend
    python -m scripts.embed_pdfs
"""

import os
import sys
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.pdf_processor import PDFProcessor
from rag.vector_store import VectorStore


def main():
    pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pdfs")
    chroma_dir = os.getenv("CHROMADB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma"))

    if not os.path.exists(pdf_dir):
        print(f"❌ PDF directory not found: {pdf_dir}")
        print("   Place your fitness PDFs in backend/data/pdfs/")
        return

    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print(f"❌ No PDF files found in: {pdf_dir}")
        return

    print(f"📚 Found {len(pdf_files)} PDF files to process")
    print(f"📂 ChromaDB path: {chroma_dir}")
    print()

    # Initialize components
    processor = PDFProcessor(chunk_size=1000, chunk_overlap=200)
    store = VectorStore(persist_directory=chroma_dir)

    total_chunks = 0

    for pdf_file in tqdm(pdf_files, desc="Processing PDFs"):
        filepath = os.path.join(pdf_dir, pdf_file)

        # Auto-detect category from filename
        name_lower = pdf_file.lower()
        if any(word in name_lower for word in ["nutrition", "diet", "food", "meal"]):
            category = "nutrition"
        elif any(word in name_lower for word in ["anatomy", "muscle", "body"]):
            category = "anatomy"
        else:
            category = "workout"

        try:
            chunks = processor.process_pdf(filepath, category=category)
            if chunks:
                count = store.add_documents(chunks)
                total_chunks += count
                print(f"  ✓ {pdf_file}: {count} chunks ({category})")
        except Exception as e:
            print(f"  ✗ {pdf_file}: {e}")

    print()
    print(f"✅ Embedding complete!")
    stats = store.get_collection_stats()
    print(f"   Total documents in store: {stats['document_count']}")
    print(f"   Total chunks added this run: {total_chunks}")


if __name__ == "__main__":
    main()
