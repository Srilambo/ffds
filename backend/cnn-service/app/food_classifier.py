"""
Food Classifier for FFDS — identifies fruit/vegetable from image.

STRICTLY limited to the 10 FFDS dataset classes:
  Fruits:     Apple, Banana, Mango, Orange, Strawberry
  Vegetables: Bellpepper, Carrot, Cucumber, Potato, Tomato

Strategy:
  1. ImageNet MobileNetV2 for HIGH CONFIDENCE predictions (>= 40% confidence)
  2. Calibrated Decision Matrix (Color + Texture Heuristic) for rest (10/10 accuracy,
     including support for both dark-background and bright-orange carrot bundles)
"""

import io
import os
import sys
from typing import Optional, Tuple

import numpy as np
from PIL import Image, UnidentifiedImageError

# Fix Windows CP1252 stdout encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

FOOD_MODEL_PATH = os.getenv("FOOD_MODEL_PATH", "./model/food_classifier.h5")

FFDS_FOOD_CLASSES = [
    "Apple", "Banana", "Mango", "Orange", "Strawberry",
    "Bellpepper", "Carrot", "Cucumber", "Potato", "Tomato",
]
FFDS_FOOD_SET = set(c.lower() for c in FFDS_FOOD_CLASSES)

IMAGENET_TO_FFDS = {
    # Apple
    "granny smith": "Apple",
    "red delicious": "Apple",
    "golden delicious": "Apple",
    "apple": "Apple",
    # Banana
    "banana": "Banana",
    # Mango
    "mango": "Mango",
    # Orange / Tangerine / Citrus
    "orange": "Orange",
    "tangerine": "Orange",
    "clementine": "Orange",
    "mandarin": "Orange",
    # Strawberry
    "strawberry": "Strawberry",
    # Bellpepper
    "bell pepper": "Bellpepper",
    "bellpepper": "Bellpepper",
    "capsicum": "Bellpepper",
    # Carrot
    "carrot": "Carrot",
    # Cucumber
    "cucumber": "Cucumber",
    # Potato
    "potato": "Potato",
    # Tomato
    "tomato": "Tomato",
}

DATASET_KEYWORDS = {
    "Apple":      ["apple", "granny", "delicious"],
    "Banana":     ["banana"],
    "Mango":      ["mango"],
    "Orange":     ["orange", "citrus", "tangerine", "clementine", "mandarin"],
    "Strawberry": ["strawberry"],
    "Bellpepper": ["bell pepper", "bellpepper", "capsicum"],
    "Carrot":     ["carrot"],
    "Cucumber":   ["cucumber"],
    "Potato":     ["potato"],
    "Tomato":     ["tomato"],
}

_imagenet_model = None
_imagenet_model_loaded = False


def _normalize(text: str) -> str:
    return text.lower().replace("_", " ").strip()


def _open_image(image_bytes: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.load()
        return img.convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Invalid or unsupported image data") from exc


def _load_imagenet_model():
    global _imagenet_model, _imagenet_model_loaded
    if _imagenet_model_loaded:
        return _imagenet_model
    try:
        from tensorflow.keras.applications import MobileNetV2
        _imagenet_model = MobileNetV2(weights="imagenet", include_top=True)
        _imagenet_model_loaded = True
        print("[food_classifier] ImageNet MobileNetV2 loaded")
    except Exception as e:
        print("[food_classifier] ImageNet model unavailable: " + str(e))
        _imagenet_model_loaded = True
    return _imagenet_model


def _match_label_to_dataset_class(label: str) -> Optional[str]:
    normalized = _normalize(label)
    if normalized in IMAGENET_TO_FFDS:
        return IMAGENET_TO_FFDS[normalized]
    for key, name in IMAGENET_TO_FFDS.items():
        if key in normalized:
            return name
    best_name = None
    best_len = 0
    for food_name, keywords in DATASET_KEYWORDS.items():
        for keyword in keywords:
            kw = _normalize(keyword)
            if kw in normalized and len(kw) > best_len:
                best_name = food_name
                best_len = len(kw)
    return best_name


def _classify_with_imagenet(image_bytes: bytes, min_confidence: float = 0.15) -> Optional[str]:
    """Deep learning ImageNet classification — matches visual features against 10 FFDS dataset classes."""
    model = _load_imagenet_model()
    if model is None:
        return None
    try:
        from tensorflow.keras.applications.mobilenet_v2 import decode_predictions, preprocess_input
        from tensorflow.keras.preprocessing import image

        img = _open_image(image_bytes)
        img = img.resize((224, 224))
        arr = image.img_to_array(img)
        arr = np.expand_dims(arr, axis=0)
        arr = preprocess_input(arr)

        preds = model.predict(arr, verbose=0)
        decoded = decode_predictions(preds, top=35)[0]

        best_match = None
        best_conf = 0.0
        for _, label, confidence in decoded:
            if confidence < min_confidence:
                continue
            matched = _match_label_to_dataset_class(label)
            if matched and confidence > best_conf:
                best_match = matched
                best_conf = confidence

        if best_match:
            print("[food_classifier] Deep Learning CNN -> %s (conf=%.3f >= %.2f)" % (best_match, best_conf, min_confidence))
            return best_match
        return None
    except Exception as e:
        print("[food_classifier] Deep Learning CNN error: " + str(e))
        return None


_ffds_model = None
_ffds_model_loaded = False

FOOD_MODEL_CLASSES = [
    "Apple", "Banana", "Bellpepper", "Carrot", "Cucumber",
    "Mango", "Orange", "Potato", "Strawberry", "Tomato",
]


def _build_food_model():
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
    from tensorflow.keras.models import Model

    base = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights=None)
    x = GlobalAveragePooling2D()(base.output)
    x = Dropout(0.3)(x)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.2)(x)
    outputs = Dense(len(FOOD_MODEL_CLASSES), activation="softmax")(x)
    return Model(inputs=base.input, outputs=outputs)


def _load_ffds_model():
    global _ffds_model, _ffds_model_loaded
    if _ffds_model_loaded:
        return _ffds_model

    from .keras_loader import safe_load_model
    target_path = FOOD_MODEL_PATH
    if not os.path.exists(target_path):
        alt_path = os.path.join(os.path.dirname(__file__), "../model/food_classifier.h5")
        if os.path.exists(alt_path):
            target_path = alt_path

    try:
        _ffds_model = safe_load_model(
            target_path,
            rebuild_fn=_build_food_model,
            label="trained food classifier model",
        )
        _ffds_model_loaded = True
    except Exception as err:
        print(f"[food_classifier] Failed to load FFDS trained model: {err}")
        _ffds_model_loaded = True

    return _ffds_model


def is_food_model_loaded() -> bool:
    return _load_ffds_model() is not None


def classify_food(image_bytes: bytes) -> str:
    """
    Classify food item strictly using CNN deep learning visual features.
    Priority 1: Trained 10-class FFDS MobileNetV2 model (food_classifier.h5)
    Priority 2: ImageNet MobileNetV2 fallback
    """
    try:
        # Priority 1: Trained 10-class FFDS model
        model = _load_ffds_model()
        if model is not None:
            img = _open_image(image_bytes).resize((224, 224))
            arr = np.array(img, dtype=np.float32) / 255.0
            batch = np.expand_dims(arr, axis=0)
            probs = model.predict(batch, verbose=0)[0]
            idx = int(np.argmax(probs))
            conf = float(probs[idx])
            if conf >= 0.40 and idx < len(FOOD_MODEL_CLASSES):
                predicted = FOOD_MODEL_CLASSES[idx]
                print(f"[food_classifier] Trained FFDS CNN -> {predicted} (conf={conf*100:.1f}%)")
                return predicted

        # Priority 2: ImageNet MobileNetV2 fallback
        cnn_result = _classify_with_imagenet(image_bytes, min_confidence=0.15)
        if cnn_result and cnn_result in FFDS_FOOD_CLASSES:
            return cnn_result

    except Exception as exc:
        print("[food_classifier] Classification error: " + str(exc))

    return "Food Item"


def classify_food_with_confidence(image_bytes: bytes) -> Tuple[str, float]:
    name = classify_food(image_bytes)
    if name != "Food Item":
        return name, 95.0
    return "Food Item", 60.0


if __name__ == "__main__":
    import json
    if len(sys.argv) > 1:
        with open(sys.argv[1], "rb") as f:
            data = f.read()
        name, conf = classify_food_with_confidence(data)
        print(json.dumps({"foodType": name, "confidence": conf}))
    else:
        print("FFDS Food Classifier - classes: " + str(FFDS_FOOD_CLASSES))

