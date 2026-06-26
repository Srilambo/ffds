# FFDS CNN Model — Training Guide

## Overview

This service uses an **EfficientNetB0** transfer-learning model to classify food freshness into three categories:

| Class | Description |
|---|---|
| `fresh` | Ripe, good-quality vegetables, fruits, and food items |
| `borderline` | Slightly overripe or early signs of deterioration |
| `spoiled` | Rotten, mouldy, or clearly bad food |

The training pipeline supports **10,000+ real images** downloaded from public Kaggle datasets covering:
- 🍎 **Fruits**: Apple, Banana, Orange, Mango, Grape, Strawberry, Watermelon, Pineapple, Papaya, etc.
- 🥦 **Vegetables**: Tomato, Carrot, Potato, Broccoli, Spinach, Cucumber, Bell Pepper, Eggplant, etc.
- 🍞 **Foods**: Bread, Egg, Meat, Fish, Cheese, Mushroom, etc.

---

## Prerequisites

### 1. Python environment
```bash
cd backend/cnn-service
python -m venv .venv
.venv\Scripts\activate        # Windows
# or: source .venv/bin/activate  (Linux/Mac)

pip install -r requirements.txt
```

### 2. Kaggle API credentials (for real dataset download)

1. Go to [kaggle.com](https://www.kaggle.com) → Account → **Create New API Token**
2. This downloads `kaggle.json`
3. Place it at:
   - **Windows**: `C:\Users\<you>\.kaggle\kaggle.json`
   - **Linux/Mac**: `~/.kaggle/kaggle.json`

OR set environment variables:
```bash
set KAGGLE_USERNAME=your_username
set KAGGLE_KEY=your_api_key
```

---

## Step-by-Step Training

### Option A — Real Dataset (Recommended, 10 000+ images)

```bash
cd backend/cnn-service

# Step 1: Download datasets from Kaggle (~2-5 GB download)
python training/download_dataset.py --data-dir ./data --min-images 10000

# Step 2: Train the model
python training/train.py --data-dir ./data --output ./model/ffds_model.h5
```

### Option B — Synthetic Data (Quick test, no Kaggle needed)

```bash
cd backend/cnn-service

# Generate 500 synthetic images per class (1 500 total)
python training/generate_mock_data.py --data-dir ./data --num-images 500

# Train (will be lower accuracy but good for testing the pipeline)
python training/train.py --data-dir ./data --output ./model/ffds_model.h5 --epochs 10 --fine-tune-epochs 5
```

---

## Training Script Options

```
python training/train.py [OPTIONS]

Options:
  --data-dir          Path to dataset (default: ./data)
  --output            Where to save model (default: ./model/ffds_model.h5)
  --epochs            Phase-1 epochs — head training (default: 15)
  --fine-tune-epochs  Phase-2 epochs — EfficientNet fine-tuning (default: 10)
  --batch-size        Images per batch (default: 32)
  --img-size          Image resolution (default: 224)
  --fine-tune-layers  Layers to unfreeze in phase 2 (default: 30)
  --no-fine-tune      Skip phase 2 (faster, slightly less accurate)
```

### Training Phases

| Phase | What happens | Duration |
|---|---|---|
| **Phase 1** | Train custom Dense head; EfficientNetB0 frozen | ~15 epochs |
| **Phase 2** | Unfreeze top 30 EfficientNet layers; fine-tune at LR=1e-5 | ~10 epochs |

Expected accuracy with 10 000+ real images: **85–95%**

---

## Dataset Download Options

```
python training/download_dataset.py [OPTIONS]

Options:
  --data-dir      Where to store organised images (default: ./data)
  --raw-dir       Scratch dir for Kaggle ZIPs (default: ./data/_raw)
  --min-images    Stop downloading when this total is reached (default: 10000)
```

Datasets downloaded automatically:
1. `sriramr/fruits-fresh-and-rotten-for-classification` (~13 000 images)
2. `raghavrpotdar/fresh-and-stale-images-of-fruits-and-vegetables` (~10 000 images)
3. `misrakahmed/vegetable-image-dataset` (~21 000 images)

---

## Output Files

After training, you'll find:

```
model/
├── ffds_model.h5        ← Trained Keras model weights
└── class_names.json     ← ["fresh", "borderline", "spoiled"]
```

The FastAPI inference service (`app/model.py`) loads both automatically.

---

## Running the Inference Service

```bash
cd backend/cnn-service
uvicorn app.main:app --reload --port 8000
```

Test it:
```bash
# Health check
curl http://localhost:8000/health

# Predict freshness
curl -X POST http://localhost:8000/predict \
  -F "file=@path/to/your/food_image.jpg"
```

Response:
```json
{
  "foodType": "Fresh",
  "label": "Fresh",
  "confidence": 94.72
}
```

---

## Data Directory Structure

```
data/
├── fresh/           ← 3 500+ fresh food images
│   ├── img_000001_apple_fresh_001.jpg
│   └── ...
├── borderline/      ← 3 500+ borderline images
│   └── ...
└── spoiled/         ← 3 500+ spoiled/rotten images
    └── ...
```
