Sprint 2: Embedding pipeline & ingestion

This folder contains helper scripts and notes to generate image embeddings (using CLIP) and ingest them into the project for visual similarity recommendations.

Steps (local machine with Python & GPU recommended):

1. Create a virtual environment and install dependencies (example using pip):

   python -m venv .venv
   source .venv/bin/activate
   pip install -U pip
   pip install torch torchvision transformers ftfy tqdm pillow

2. Run the embedding generator on your product images (the script searches `public/` for images referenced by product IDs in `lib/product-data.ts`):

   python generate_embeddings.py --out ../lib/embeddings.json

3. Copy or move the generated `embeddings.json` into `lib/` (the script can write there directly when run from the repository root).

Notes:

- This repository includes a small `lib/sample-embeddings.json` (toy data) for quick testing without running the generator.
- For production, consider running embeddings generation in a dedicated ML environment (GPU-backed) and storing embeddings in a vector DB (Pinecone, Milvus, Faiss) for efficient nearest-neighbor search.
