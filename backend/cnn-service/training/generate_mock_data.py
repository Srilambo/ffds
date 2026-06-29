"""
Generate synthetic/mock images for testing the CNN model training.
Creates directory structure:
  /data/
    fresh/
    borderline/
    spoiled/
with dummy images.
"""

import os
import argparse
import numpy as np
from PIL import Image

CLASS_NAMES = ["fresh", "borderline", "spoiled"]

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic images for CNN training")
    parser.add_argument(
        "--data-dir",
        default="./data",
        help="Target directory to create the dataset structure",
    )
    parser.add_argument(
        "--num-images",
        type=int,
        default=40,
        help="Number of images to generate per class",
    )
    args = parser.parse_args()

    data_dir = args.data_dir
    num_images = args.num_images

    print(f"Generating synthetic dataset at {data_dir}...")
    for class_name in CLASS_NAMES:
        class_dir = os.path.join(data_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        print(f"Creating {num_images} images for class '{class_name}'...")
        
        for i in range(num_images):
            # Generate a random 224x224 RGB image
            # We can vary the primary color depending on class for a tiny bit of "learning" signal
            if class_name == "fresh":
                # Greenish/fresh color bias
                color_bias = [50, 180, 50]
            elif class_name == "borderline":
                # Yellowish/borderline color bias
                color_bias = [180, 180, 50]
            else:
                # Brownish/spoiled color bias
                color_bias = [120, 90, 50]
                
            img_data = np.random.randint(0, 80, (224, 224, 3), dtype=np.uint8)
            img_data = img_data + np.array(color_bias, dtype=np.uint8)
            img_data = np.clip(img_data, 0, 255).astype(np.uint8)
            
            img = Image.fromarray(img_data)
            img_path = os.path.join(class_dir, f"{class_name}_{i:03d}.jpg")
            img.save(img_path, format="JPEG")

    print("Synthetic dataset generation complete!")

if __name__ == "__main__":
    main()
