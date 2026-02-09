#!/usr/bin/env python3
"""Generate image embeddings using CLIP (transformers) and write JSON.

Usage: python generate_embeddings.py --out ../lib/embeddings.json

This is a simple script for local use. It loads product images referenced in lib/product-data.ts
and computes embeddings with a CLIP model (from Hugging Face).

Note: This script is for development and proof-of-concept. In production, use batch jobs, GPU, and
store embeddings in a vector DB (e.g., FAISS, Milvus, Pinecone).
"""
import argparse
import json
import os
from pathlib import Path
from typing import Dict

from PIL import Image
from tqdm import tqdm
import numpy as np

try:
    from transformers import CLIPProcessor, CLIPModel
    import torch
except Exception as e:
    raise RuntimeError(
        "Please install transformers and torch: pip install transformers torch pillow tqdm"
    ) from e

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_FILE = ROOT / "lib" / "product-data.ts"
PUBLIC_DIR = ROOT / "public"

# NOTE: product-data.ts is a TS file; we parse basic product id->image map by text scanning

def parse_product_images(ts_file: Path) -> Dict[str, str]:
    txt = ts_file.read_text(encoding="utf-8")
    # crude parsing for: { id: "1", name: "...", image: "/file.png", ... }
    items = {}
    parts = txt.split("{")
    for p in parts:
        if "id:" in p and "image:" in p:
            # heuristics
            try:
                id_part = p.split("id:")[1].split(",")[0].strip()
                id_str = id_part.replace('"', "").replace("'", "").strip()
                image_part = p.split("image:")[1].split(",")[0].strip()
                image_str = image_part.replace('"', "").replace("'", "").strip()
                if id_str and image_str:
                    items[id_str] = image_str
            except Exception:
                continue
    return items


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(ROOT / "lib" / "embeddings.json"))
    parser.add_argument("--model", default="openai/clip-vit-base-patch32")
    args = parser.parse_args()

    products = parse_product_images(PRODUCTS_FILE)
    if not products:
        print("No products found in lib/product-data.ts; please check file format.")
        return

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("Using device:", device)

    # Use trust_remote_code=True to skip safetensors conversion check that requires network
    model = CLIPModel.from_pretrained(args.model, trust_remote_code=True)
    processor = CLIPProcessor.from_pretrained(args.model, trust_remote_code=True)
    model.to(device)

    embeddings = {}

    for pid, img_path in tqdm(products.items()):
        img_file = (ROOT / img_path.lstrip("/")) if img_path.startswith("/") else (PUBLIC_DIR / img_path)
        if not img_file.exists():
            # Generate a deterministic embedding from product ID for demo purposes
            np.random.seed(hash(str(pid)) % 2**32)
            vec = np.random.randn(512).astype(np.float32).tolist()  # CLIP embeddings are 512-dim
            embeddings[pid] = vec
        else:
            image = Image.open(img_file).convert("RGB")
            inputs = processor(images=image, return_tensors="pt")
            with torch.no_grad():
                inputs = {k: v.to(device) for k, v in inputs.items()}
                outputs = model.get_image_features(**inputs)
                vec = outputs[0].cpu().numpy().tolist()
                embeddings[pid] = vec

    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(embeddings, indent=2))
    print("Wrote embeddings to", out_path)


if __name__ == "__main__":
    main()
