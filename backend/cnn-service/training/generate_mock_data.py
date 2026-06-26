"""
Generate synthetic / mock images for testing CNN model training.
Creates directory structure:
  data/
    fresh/        - green-biased images with fruit/vegetable textures
    borderline/   - yellow-biased images
    spoiled/      - brown-biased images

Usage:
  python training/generate_mock_data.py [--data-dir ./data] [--num-images 500]
"""

import argparse
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

CLASS_NAMES = ["fresh", "borderline", "spoiled"]

# Color palettes per class  (R, G, B base)
CLASS_COLORS = {
    "fresh": [
        (40, 160, 40),    # apple-green
        (80, 180, 30),    # lime
        (220, 80, 60),    # red apple
        (255, 165, 0),    # orange
        (255, 210, 0),    # yellow pepper
    ],
    "borderline": [
        (180, 160, 30),   # slightly dull yellow
        (160, 130, 20),   # dull orange
        (140, 100, 50),   # light brown
        (200, 150, 60),   # brownish orange
        (170, 170, 60),   # dull green
    ],
    "spoiled": [
        (80, 55, 30),     # dark brown
        (60, 40, 20),     # very dark
        (100, 70, 40),    # mouldy brown
        (50, 60, 30),     # dark greenish-brown
        (90, 50, 50),     # reddish dark
    ],
}

# Noise level per class (spoiled = noisiest / most texture degradation)
CLASS_NOISE = {
    "fresh": 20,
    "borderline": 45,
    "spoiled": 80,
}


def _make_image(class_name: str, size: int = 224) -> Image.Image:
    """Generate a synthetic food-like image for *class_name*."""
    palette = CLASS_COLORS[class_name]
    base_color = random.choice(palette)
    noise_std = CLASS_NOISE[class_name]

    # Base canvas
    img_data = np.full((size, size, 3), base_color, dtype=np.int32)

    # Add noise
    noise = np.random.normal(0, noise_std, (size, size, 3)).astype(np.int32)
    img_data = np.clip(img_data + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_data)

    # Draw a rough circular "food" shape
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    r = int(size * random.uniform(0.30, 0.44))
    dr, dg, db = base_color
    circle_color = (
        max(0, min(255, dr + random.randint(-30, 30))),
        max(0, min(255, dg + random.randint(-30, 30))),
        max(0, min(255, db + random.randint(-30, 30))),
    )
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=circle_color)

    # Slight blur to look more realistic
    img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))
    return img


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic images for CNN training"
    )
    parser.add_argument("--data-dir", default="./data",
                        help="Target directory to create the dataset structure")
    parser.add_argument("--num-images", type=int, default=500,
                        help="Number of images per class (default 500)")
    parser.add_argument("--img-size", type=int, default=224)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)

    data_dir = args.data_dir
    num_images = args.num_images

    print(f"Generating synthetic dataset at {data_dir}...")
    print(f"  {num_images} images per class ({len(CLASS_NAMES) * num_images} total)")

    for class_name in CLASS_NAMES:
        class_dir = os.path.join(data_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)

        # Skip already-generated images
        existing = len([f for f in os.listdir(class_dir) if f.endswith(".jpg")])
        remaining = num_images - existing
        if remaining <= 0:
            print(f"  [OK] {class_name}: already has {existing} images -- skipping")
            continue

        print(f"  Creating {remaining} images for '{class_name}'...")
        for i in range(existing, existing + remaining):
            img = _make_image(class_name, args.img_size)
            path = os.path.join(class_dir, f"{class_name}_{i:05d}.jpg")
            img.save(path, format="JPEG", quality=90)

    total = sum(
        len([f for f in os.listdir(os.path.join(data_dir, c)) if f.endswith(".jpg")])
        for c in CLASS_NAMES
    )
    print(f"\n[DONE] Synthetic dataset ready -- {total} images total")
    print("   Run: python training/train.py")


if __name__ == "__main__":
    main()
