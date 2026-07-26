"""
FFDS Food Classifier — Final Test
====================================
Picks up to 3 sample images per class from ./data/fresh/
and runs classify_food_with_confidence() on each.
Prints a clean pass/fail table and an overall accuracy score.

Run from the cnn-service folder:
  python final_test.py
"""

import os
import sys
import random
import pathlib

# ── make sure we import from THIS package, not a system install ──────────────
sys.path.insert(0, str(pathlib.Path(__file__).parent))

# Windows UTF-8 fix
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── colour helpers ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ── test cases: (label, subfolder-glob, keyword-in-filename) ─────────────────
# The data/fresh folder has mixed images; we'll use the 10 labelled
# subfolders from kaggle_raw if available, otherwise data/fresh as fallback.
CLASSES = [
    "Apple", "Banana", "Mango", "Orange", "Strawberry",
    "Bellpepper", "Carrot", "Cucumber", "Potato", "Tomato",
]

SAMPLES_PER_CLASS = 3   # how many images to test per class
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def find_images_for_class(class_name: str) -> list:
    """
    Search heuristics (in priority order):
      1. kaggle_raw/fruits-and-vegetables-dataset/Fruits_Vegetables_Dataset(12000)/Fruits/Fresh<Class>/
      2. kaggle_raw/fruits-and-vegetables-dataset/Fruits_Vegetables_Dataset(12000)/Vegetables/Fresh<Class>/
      3. kaggle_raw/extracted/food_data/<ClassName>/  (legacy reorganised)
      4. data/fresh/  (last resort — unlabelled, skip unless nothing else found)
    """
    root = pathlib.Path(__file__).parent
    dataset_root = (
        root / "kaggle_raw" / "fruits-and-vegetables-dataset"
        / "Fruits_Vegetables_Dataset(12000)"
    )

    candidates = []

    # 1 & 2. Official Kaggle labelled folders
    for sub in ("Fruits", "Vegetables"):
        fresh_dir = dataset_root / sub / f"Fresh{class_name}"
        if fresh_dir.is_dir():
            candidates = [p for p in fresh_dir.iterdir() if p.suffix.lower() in IMG_EXTS]
            break

    # 3. Legacy reorganised folder
    if not candidates:
        food_data = root / "kaggle_raw" / "extracted" / "food_data" / class_name
        if food_data.is_dir():
            candidates = [p for p in food_data.iterdir() if p.suffix.lower() in IMG_EXTS]

    # 4. Last resort: data/fresh (unlabelled — results not meaningful per class)
    if not candidates:
        fresh_dir = root / "data" / "fresh"
        if fresh_dir.is_dir():
            candidates = [p for p in fresh_dir.iterdir() if p.suffix.lower() in IMG_EXTS]

    random.shuffle(candidates)
    return [str(p) for p in candidates[:SAMPLES_PER_CLASS]]


def main():
    print(f"\n{BOLD}{CYAN}{'='*60}")
    print("  FFDS Food Classifier -- Final Test")
    print(f"{'='*60}{RESET}\n")

    print(f"{YELLOW}Loading classifier (TensorFlow may take a moment)...{RESET}")
    try:
        from app.food_classifier import classify_food_with_confidence
        print(f"{GREEN}Classifier loaded successfully.{RESET}\n")
    except Exception as e:
        print(f"{RED}ERROR: Could not import classifier: {e}{RESET}")
        sys.exit(1)

    results = []   # (class, path, predicted, conf, correct)

    for cls in CLASSES:
        images = find_images_for_class(cls)
        if not images:
            print(f"{YELLOW}[SKIP] {cls:<12} -- no test images found{RESET}")
            continue

        for img_path in images:
            try:
                with open(img_path, "rb") as f:
                    data = f.read()
                predicted, conf = classify_food_with_confidence(data)
                correct = predicted.lower() == cls.lower()
                results.append((cls, img_path, predicted, conf, correct))
            except Exception as e:
                results.append((cls, img_path, f"ERROR: {e}", 0.0, False))

    if not results:
        print(f"{RED}No images were found to test. "
              f"Make sure kaggle_raw/extracted or data/fresh has images.{RESET}")
        sys.exit(1)

    # ── Print results table ──────────────────────────────────────────────────
    print(f"\n{BOLD}{'Class':<14}{'Predicted':<16}{'Conf':>8}  {'Result':<8} File{RESET}")
    print("-" * 70)

    total = len(results)
    correct_count = 0

    for cls, path, predicted, conf, correct in results:
        fname = os.path.basename(path)[:22]
        status = f"{GREEN}PASS{RESET}" if correct else f"{RED}FAIL{RESET}"
        if correct:
            correct_count += 1
        conf_str = f"{conf:.1f}%"
        pred_col = f"{GREEN}{predicted:<16}{RESET}" if correct else f"{RED}{predicted:<16}{RESET}"
        print(f"{cls:<14}{pred_col}{conf_str:>8}  {status:<8} {fname}")

    # ── Summary ──────────────────────────────────────────────────────────────
    pct = 100.0 * correct_count / total if total else 0
    bar_len = 40
    filled = int(bar_len * correct_count / total) if total else 0
    bar = "\u2588" * filled + "\u2591" * (bar_len - filled)

    print(f"\n{BOLD}{'-'*70}")
    print(f"Results : {correct_count}/{total} correct")
    print(f"Accuracy: {pct:.1f}%")
    print(f"[{GREEN}{bar}{RESET}]{RESET}")

    if pct == 100:
        print(f"\n{GREEN}{BOLD}All tests passed! Classifier is working perfectly.{RESET}")
    elif pct >= 80:
        print(f"\n{YELLOW}{BOLD}Good. Minor misclassifications -- see FAIL rows above.{RESET}")
    else:
        print(f"\n{RED}{BOLD}Low accuracy. Review thresholds in food_classifier.py.{RESET}")

    print()


if __name__ == "__main__":
    random.seed(42)
    main()
