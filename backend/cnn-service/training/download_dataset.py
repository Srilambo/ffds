"""
FFDS Dataset Downloader
=======================
Downloads real food, vegetable, and fruit images from Kaggle datasets.
Organises them into:
  data/
    fresh/
    borderline/
    spoiled/

Datasets used (all free/public on Kaggle):
  1. fruits-fresh-and-rotten-for-classification  (~13 000 images)
  2. fresh-and-stale-images-of-fruits-and-vegetables (~10 000 images)
  3. vegetable-image-dataset (~21 000 images - used as "fresh" base)

Requirements:
  - kaggle CLI configured (~/.kaggle/kaggle.json) OR
    KAGGLE_USERNAME + KAGGLE_KEY env vars set.

Usage:
  python training/download_dataset.py [--data-dir ./data] [--min-images 10000]
"""

import argparse
import os
import random
import shutil
import zipfile
from pathlib import Path

# ------------------------------------------------------------------------------
# Kaggle dataset slugs we will pull
# ------------------------------------------------------------------------------
KAGGLE_DATASETS = [
    # (owner/dataset-slug, description)
    ("sriramr/fruits-fresh-and-rotten-for-classification",
     "Fresh & Rotten Fruits (~13 k)"),
    ("raghavrpotdar/fresh-and-stale-images-of-fruits-and-vegetables",
     "Fresh & Stale Fruits/Vegetables (~10 k)"),
    ("misrakahmed/vegetable-image-dataset",
     "Vegetable Images (~21 k)"),
]

# Keyword lists used to auto-sort images into freshness buckets when the
# source folder name already encodes freshness.
FRESH_KEYWORDS = ["fresh", "good", "ripe", "new"]
BORDERLINE_KEYWORDS = ["overripe", "mild", "borderline", "slightly", "medium"]
SPOILED_KEYWORDS = ["rotten", "stale", "bad", "spoiled", "old", "mouldy", "moldy", "decay"]

TARGET_PER_CLASS = 3500  # aim for ~10 500 total (3x3 500)

IMG_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def _classify_folder(folder_name: str) -> str | None:
    """Return 'fresh', 'borderline', 'spoiled', or None based on folder name."""
    name = folder_name.lower()
    for kw in SPOILED_KEYWORDS:
        if kw in name:
            return "spoiled"
    for kw in BORDERLINE_KEYWORDS:
        if kw in name:
            return "borderline"
    for kw in FRESH_KEYWORDS:
        if kw in name:
            return "fresh"
    return None  # can't determine - caller will default to "fresh"


def _collect_images(root: Path) -> list[Path]:
    """Recursively find all image files under *root*."""
    return [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in IMG_EXTENSIONS
    ]


def _download_kaggle_dataset(slug: str, dest: Path) -> Path:
    """Download and unzip a Kaggle dataset into *dest*/<dataset-name>/."""
    import kaggle  # noqa: F401 - ensure API is importable before network call

    dataset_name = slug.split("/")[1]
    out_dir = dest / dataset_name
    if out_dir.exists() and any(out_dir.iterdir()):
        print(f"  [OK] Already downloaded: {dataset_name}")
        return out_dir

    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"  v Downloading {slug} ...")
    os.system(
        f'kaggle datasets download -d "{slug}" -p "{out_dir}" --unzip'
    )
    return out_dir


def _copy_images(src_images: list[Path], dest_class_dir: Path, max_count: int,
                 current_count: int) -> int:
    """Copy up to *max_count - current_count* images. Returns new total."""
    needed = max_count - current_count
    if needed <= 0:
        return current_count
    random.shuffle(src_images)
    for img in src_images[:needed]:
        safe_name = img.stem[:40] + img.suffix  # truncate long names
        dst = dest_class_dir / f"img_{current_count:06d}_{safe_name}"
        try:
            shutil.copy2(img, dst)
            current_count += 1
        except Exception as e:
            print(f"    [WARN] Could not copy {img}: {e}")
    return current_count


def main():
    parser = argparse.ArgumentParser(description="Download real food datasets for FFDS CNN")
    parser.add_argument("--data-dir", default="./data",
                        help="Root directory for the organised dataset")
    parser.add_argument("--raw-dir", default="./data/_raw",
                        help="Scratch directory for raw Kaggle downloads")
    parser.add_argument("--min-images", type=int, default=10000,
                        help="Minimum total images required across all classes")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)

    data_dir = Path(args.data_dir)
    raw_dir = Path(args.raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)

    # Create target class dirs
    class_dirs = {}
    for cls in ["fresh", "borderline", "spoiled"]:
        d = data_dir / cls
        d.mkdir(parents=True, exist_ok=True)
        class_dirs[cls] = d

    # Counters - don't overwrite existing images
    counts = {cls: len(list(class_dirs[cls].glob("*"))) for cls in class_dirs}
    print(f"\nExisting images: {counts}")

    # -- Download datasets -----------------------------------------------------
    for slug, desc in KAGGLE_DATASETS:
        total = sum(counts.values())
        if total >= args.min_images:
            print(f"\n[OK] Reached {total} images - skipping remaining downloads.")
            break

        print(f"\n {desc}")
        try:
            dataset_root = _download_kaggle_dataset(slug, raw_dir)
        except Exception as e:
            print(f"  [ERROR] Download failed: {e}")
            continue

        # Walk the downloaded folder structure
        for folder in sorted(dataset_root.rglob("*")):
            if not folder.is_dir():
                continue
            bucket = _classify_folder(folder.name)
            if bucket is None:
                # Unknown folder - treat as fresh if it directly contains images
                imgs = [p for p in folder.iterdir()
                        if p.is_file() and p.suffix.lower() in IMG_EXTENSIONS]
                if imgs:
                    bucket = "fresh"
                else:
                    continue

            imgs = [p for p in folder.iterdir()
                    if p.is_file() and p.suffix.lower() in IMG_EXTENSIONS]
            if not imgs:
                continue

            counts[bucket] = _copy_images(
                imgs, class_dirs[bucket], TARGET_PER_CLASS, counts[bucket]
            )

    # -- Summary ---------------------------------------------------------------
    total = sum(counts.values())
    print("\n" + "=" * 50)
    print(f"Dataset ready - {total} images total")
    for cls, cnt in counts.items():
        print(f"  {cls:12s}: {cnt:5d} images -> {class_dirs[cls]}")

    if total < args.min_images:
        print(f"\n[WARN]  Only {total} images collected (target: {args.min_images}).")
        print("   Try running with more Kaggle datasets or augment with generate_mock_data.py")
    else:
        print(f"\n[OK] Ready to train - run: python training/train.py")


if __name__ == "__main__":
    main()
