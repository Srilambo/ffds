"""
FFDS Kaggle Dataset Organizer
==============================
Reorganizes the Mukhiddinov Kaggle dataset into FFDS training format.

Kaggle structure (after unzip):
  Fruits_Vegetables_Dataset(12000)/
    Fruits/
      FreshApple/   <- maps to fresh/
      RottenApple/  <- maps to spoiled/
      FreshBanana/
      RottenBanana/
      ...
    Vegetables/
      FreshBellpepper/
      RottenBellpepper/
      ...

Output structure (for train.py):
  data/
    fresh/      <- all Fresh* images
    borderline/ <- 20% sampled from Fresh* images
    spoiled/    <- all Rotten* images

Usage:
  cd backend/cnn-service
  python training/organize_kaggle_data.py
"""

import argparse
import os
import random
import shutil
import zipfile
from pathlib import Path

RANDOM_SEED = 42
BORDERLINE_RATIO = 0.20
IMG_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

FRESH_KEYWORDS  = ['fresh']
ROTTEN_KEYWORDS = ['rotten', 'stale', 'spoil', 'old', 'bad', 'decay']


def is_image(path: Path) -> bool:
    return path.suffix.lower() in IMG_EXTENSIONS


def classify_folder(folder_name: str):
    name_lower = folder_name.lower()
    for kw in ROTTEN_KEYWORDS:
        if kw in name_lower:
            return 'spoiled'
    for kw in FRESH_KEYWORDS:
        if kw in name_lower:
            return 'fresh'
    return None


def collect_images(root: Path) -> dict:
    collected = {'fresh': [], 'spoiled': []}
    for dirpath, dirnames, filenames in os.walk(root):
        folder = Path(dirpath).name
        cls = classify_folder(folder)
        if cls is None:
            continue
        for f in filenames:
            p = Path(dirpath) / f
            if is_image(p):
                collected[cls].append(p)
    return collected


def copy_images(src_list, dest_dir: Path, label: str):
    dest_dir.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(src_list):
        ext = src.suffix.lower()
        dest = dest_dir / f"{label}_{i:05d}{ext}"
        shutil.copy2(src, dest)
    print("  Copied " + str(len(src_list)) + " images to " + str(dest_dir))


def main():
    parser = argparse.ArgumentParser(description="Organise Kaggle dataset for FFDS training")
    parser.add_argument(
        "--zip-path",
        default="./kaggle_raw/fruits-and-vegetables-dataset.zip",
        help="Path to the downloaded Kaggle zip file",
    )
    parser.add_argument(
        "--extract-dir",
        default="./kaggle_raw/extracted",
        help="Directory to extract zip into",
    )
    parser.add_argument(
        "--data-dir",
        default="./data",
        help="Output directory containing fresh/ borderline/ spoiled/",
    )
    args = parser.parse_args()

    zip_path    = Path(args.zip_path)
    extract_dir = Path(args.extract_dir)
    data_dir    = Path(args.data_dir)

    # Step 1: Unzip
    if not zip_path.exists():
        print("ERROR: zip not found at " + str(zip_path))
        print("Run: kaggle datasets download muhriddinmuxiddinov/fruits-and-vegetables-dataset --path ./kaggle_raw")
        return

    print("Extracting " + str(zip_path) + " to " + str(extract_dir) + " ...")
    extract_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(extract_dir)
    print("Extraction complete.")

    # Step 2: Collect images
    print("\nScanning extracted files...")
    collected = collect_images(extract_dir)
    print("  Found " + str(len(collected['fresh'])) + " fresh images")
    print("  Found " + str(len(collected['spoiled'])) + " spoiled/rotten images")

    # Step 3: Clear synthetic data
    for cls in ['fresh', 'borderline', 'spoiled']:
        cls_dir = data_dir / cls
        if cls_dir.exists():
            shutil.rmtree(cls_dir)
            print("  Cleared old " + cls + "/ folder")

    # Step 4: Sample borderline from fresh
    random.seed(RANDOM_SEED)
    borderline_count = int(len(collected['fresh']) * BORDERLINE_RATIO)
    borderline_imgs  = random.sample(collected['fresh'], borderline_count)
    print("\n  Sampled " + str(borderline_count) + " images for borderline/ class")

    # Step 5: Copy to data/
    print("\nCopying images to data/ ...")
    copy_images(collected['fresh'],   data_dir / 'fresh',      'fresh')
    copy_images(borderline_imgs,      data_dir / 'borderline', 'borderline')
    copy_images(collected['spoiled'], data_dir / 'spoiled',    'spoiled')

    total = len(collected['fresh']) + len(borderline_imgs) + len(collected['spoiled'])
    print("\n========================================")
    print("  Dataset organised successfully!")
    print("========================================")
    print("  fresh/      : " + str(len(collected['fresh'])) + " images")
    print("  borderline/ : " + str(len(borderline_imgs)) + " images (20% of fresh)")
    print("  spoiled/    : " + str(len(collected['spoiled'])) + " images")
    print("  TOTAL       : " + str(total) + " images")
    print("========================================")
    print("Next: python training/train.py --data-dir ./data --output ./model/ffds_mobilenetv2.h5")


if __name__ == "__main__":
    main()
