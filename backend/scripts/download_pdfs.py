"""
GymRat AI — PDF Downloader
Downloads free, publicly available fitness PDFs for the RAG knowledge base.

Usage:
    cd backend
    python -m scripts.download_pdfs
"""

import os
import sys
import httpx

# Ensure backend root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ============================================
# Free, Publicly Available Fitness PDFs
# ============================================
# These are government / open-access publications
# that are legally free to download and use.

PDF_SOURCES = [
    {
        "url": "https://www.cdc.gov/physicalactivity/downloads/growing_stronger.pdf",
        "filename": "CDC_Growing_Stronger_Strength_Training.pdf",
        "category": "workout",
        "description": "CDC Growing Stronger - Strength Training for Older Adults",
    },
    {
        "url": "https://www.acefitness.org/wp-content/uploads/2024/07/FreeSampler-PersonalTrainersHandbook.pdf",
        "filename": "ACE_Personal_Trainers_Handbook_Sample.pdf",
        "category": "workout",
        "description": "ACE Personal Trainer's Handbook Free Sampler",
    },
    {
        "url": "https://health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf",
        "filename": "US_Physical_Activity_Guidelines.pdf",
        "category": "workout",
        "description": "Physical Activity Guidelines for Americans (2nd Edition)",
    },
    {
        "url": "https://www.fda.gov/media/135301/download",
        "filename": "FDA_Nutrition_Facts_Label.pdf",
        "category": "nutrition",
        "description": "FDA Guide - How to Understand and Use the Nutrition Facts Label",
    },
    {
        "url": "https://www.dshs.texas.gov/sites/default/files/LIDS-EPI/2020-Fitness-Gram-Healthy-Fitness-Zone-Standards.pdf",
        "filename": "FitnessGram_Healthy_Fitness_Zone.pdf",
        "category": "workout",
        "description": "FitnessGram Healthy Fitness Zone Standards",
    },
]


def download_file(url: str, dest: str, description: str) -> bool:
    """Download a file with progress indicator."""
    try:
        print(f"  ⬇️  Downloading: {description}")
        print(f"     URL: {url}")

        with httpx.Client(follow_redirects=True, timeout=60.0) as client:
            response = client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")

            with open(dest, "wb") as f:
                f.write(response.content)

            size_mb = os.path.getsize(dest) / (1024 * 1024)
            print(f"     ✅ Saved: {os.path.basename(dest)} ({size_mb:.1f} MB)")
            return True

    except httpx.HTTPStatusError as e:
        print(f"     ❌ HTTP Error {e.response.status_code}: {url}")
        return False
    except httpx.ConnectError:
        print(f"     ❌ Connection failed: {url}")
        return False
    except Exception as e:
        print(f"     ❌ Error: {e}")
        return False


def main():
    pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pdfs")
    os.makedirs(pdf_dir, exist_ok=True)

    print("=" * 60)
    print("🏋️  GymRat AI — PDF Knowledge Base Downloader")
    print("=" * 60)
    print(f"📂 Target directory: {pdf_dir}")
    print(f"📚 Sources to download: {len(PDF_SOURCES)}")
    print()

    success_count = 0
    skip_count = 0
    fail_count = 0

    for source in PDF_SOURCES:
        dest_path = os.path.join(pdf_dir, source["filename"])

        # Skip if already downloaded
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1024:
            print(f"  ⏭️  Already exists: {source['filename']}")
            skip_count += 1
            continue

        if download_file(source["url"], dest_path, source["description"]):
            success_count += 1
        else:
            fail_count += 1
            # Clean up partial downloads
            if os.path.exists(dest_path):
                os.remove(dest_path)

    print()
    print("=" * 60)
    print(f"📊 Results: {success_count} downloaded, {skip_count} skipped, {fail_count} failed")

    # List final contents
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    print(f"📂 PDFs in {pdf_dir}: {len(pdf_files)}")
    for f in pdf_files:
        size = os.path.getsize(os.path.join(pdf_dir, f)) / (1024 * 1024)
        print(f"   • {f} ({size:.1f} MB)")

    if pdf_files:
        print()
        print("✅ Next step: Run embedding pipeline:")
        print("   python -m scripts.embed_pdfs")
    else:
        print()
        print("⚠️  No PDFs available. Please manually add PDFs to:")
        print(f"   {pdf_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
