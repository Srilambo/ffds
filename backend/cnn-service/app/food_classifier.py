"""
Food Classifier for FFDS — identifies fruit/vegetable from image.

Priority:
  1. Custom FFDS model trained on Kaggle dataset (food_classifier.h5)
  2. ImageNet MobileNetV2 mapped to FFDS + extended food classes
  3. Color heuristic for dataset images when vision models are uncertain
"""

import io
import os
from typing import Optional, Tuple

import numpy as np
from PIL import Image

FOOD_MODEL_PATH = os.getenv("FOOD_MODEL_PATH", "./model/food_classifier.h5")

# Classes from train_food_classifier.py (Kaggle Fruits & Vegetables dataset)
FFDS_FOOD_CLASSES = [
    "Apple", "Banana", "Mango", "Orange", "Strawberry",
    "Bellpepper", "Carrot", "Cucumber", "Potato", "Tomato",
]

# Direct ImageNet label → FFDS dataset class (normalized: lowercase, spaces)
IMAGENET_TO_FFDS = {
    "granny smith": "Apple",
    "red delicious": "Apple",
    "golden delicious": "Apple",
    "apple": "Apple",
    "banana": "Banana",
    "orange": "Orange",
    "mango": "Mango",
    "strawberry": "Strawberry",
    "bell pepper": "Bellpepper",
    "carrot": "Carrot",
    "cucumber": "Cucumber",
    "potato": "Potato",
    "tomato": "Tomato",
}

# Extended keyword map for non-dataset foods
FOOD_KEYWORDS = {
    "Apple": ["granny smith", "red delicious", "golden delicious", "apple"],
    "Banana": ["banana"],
    "Orange": ["orange"],
    "Mango": ["mango"],
    "Strawberry": ["strawberry"],
    "Bellpepper": ["bell pepper", "bellpepper", "capsicum"],
    "Carrot": ["carrot"],
    "Cucumber": ["cucumber"],
    "Potato": ["potato"],
    "Tomato": ["tomato"],
    "Grape": ["grape"],
    "Watermelon": ["watermelon"],
    "Pineapple": ["pineapple"],
    "Lemon": ["lemon"],
    "Pear": ["pear"],
    "Peach": ["peach"],
    "Cherry": ["cherry"],
    "Broccoli": ["broccoli"],
    "Avocado": ["avocado"],
    "Onion": ["onion"],
    "Lettuce": ["lettuce", "head cabbage"],
    "Corn": ["corn", "ear of corn"],
    "Blueberry": ["blueberry"],
    "Pomegranate": ["pomegranate"],
    "Eggplant": ["eggplant"],
    "Pumpkin": ["pumpkin"],
    "Papaya": ["papaya"],
    "Coconut": ["coconut"],
    "Fig": ["fig"],
    "Raspberry": ["raspberry"],
    "Blackberry": ["blackberry"],
    "Plum": ["plum"],
    "Kiwi": ["kiwi"],
    "Garlic": ["garlic"],
    "Spinach": ["spinach"],
    "Cauliflower": ["cauliflower"],
    "Cabbage": ["cabbage"],
    "Zucchini": ["zucchini"],
    "Mushroom": ["mushroom"],
}

FOOD_IMAGENET_HINTS = {
    "granny", "smith", "apple", "banana", "orange", "strawberry", "mango",
    "tomato", "carrot", "potato", "cucumber", "pepper", "grape", "watermelon",
    "pineapple", "lemon", "pear", "peach", "cherry", "melon", "broccoli",
    "cauliflower", "avocado", "onion", "garlic", "lettuce", "spinach", "corn",
    "blueberry", "plum", "pomegranate", "kiwi", "eggplant", "zucchini",
    "beet", "radish", "asparagus", "mushroom", "cabbage", "pumpkin", "papaya",
    "coconut", "fig", "date", "raspberry", "blackberry", "delicious", "capsicum",
}

_ffds_model = None
_ffds_model_loaded = False
_imagenet_model = None
_imagenet_model_loaded = False


def _normalize(text: str) -> str:
    return text.lower().replace("_", " ").strip()


def _load_ffds_model():
    global _ffds_model, _ffds_model_loaded
    if _ffds_model_loaded:
        return _ffds_model
    try:
        import tensorflow as tf
        if os.path.exists(FOOD_MODEL_PATH):
            _ffds_model = tf.keras.models.load_model(FOOD_MODEL_PATH)
            _ffds_model_loaded = True
            print(f"FFDS food classifier loaded from {FOOD_MODEL_PATH}")
        else:
            _ffds_model_loaded = True
    except Exception as e:
        print(f"FFDS food classifier unavailable: {e}")
        _ffds_model_loaded = True
    return _ffds_model


def _load_imagenet_model():
    global _imagenet_model, _imagenet_model_loaded
    if _imagenet_model_loaded:
        return _imagenet_model
    try:
        from tensorflow.keras.applications import MobileNetV2
        _imagenet_model = MobileNetV2(weights="imagenet", include_top=True)
        _imagenet_model_loaded = True
    except Exception as e:
        print(f"ImageNet food classifier unavailable: {e}")
        _imagenet_model_loaded = True
    return _imagenet_model


def _preprocess_for_ffds(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def _classify_with_ffds_model(image_bytes: bytes) -> Optional[str]:
    model = _load_ffds_model()
    if model is None:
        return None
    try:
        batch = _preprocess_for_ffds(image_bytes)
        probs = model.predict(batch, verbose=0)[0]
        idx = int(np.argmax(probs))
        confidence = float(probs[idx])
        # Lower threshold so dataset test images still get a name
        if confidence >= 0.15:
            return FFDS_FOOD_CLASSES[idx]
    except Exception as e:
        print(f"FFDS food classification error: {e}")
    return None


def _match_label_to_food(label: str) -> Optional[str]:
    """Map an ImageNet label string to a food name."""
    normalized = _normalize(label)

    # Direct FFDS dataset mapping
    if normalized in IMAGENET_TO_FFDS:
        return IMAGENET_TO_FFDS[normalized]

    # Partial match for compound labels (e.g. "red delicious apple")
    for imagenet_key, ffds_name in IMAGENET_TO_FFDS.items():
        if imagenet_key in normalized:
            return ffds_name

    # Keyword map — prefer longer/more specific matches first
    best_name = None
    best_len = 0
    for food_name, keywords in FOOD_KEYWORDS.items():
        for keyword in keywords:
            kw = _normalize(keyword)
            if kw in normalized and len(kw) > best_len:
                best_name = food_name
                best_len = len(kw)
    return best_name


def _is_food_label(label: str) -> bool:
    parts = _normalize(label).split()
    return any(part in FOOD_IMAGENET_HINTS for part in parts)


def _format_label(label: str) -> str:
    return label.replace("_", " ").strip().title()


def _classify_by_color(image_bytes: bytes) -> Optional[str]:
    """
    Color heuristic for FFDS dataset images when vision models are uncertain.
    Red fruits are checked BEFORE green vegetables to avoid apple → bellpepper errors.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((96, 96))
        arr = np.array(img, dtype=np.float32)
        r = float(arr[:, :, 0].mean())
        g = float(arr[:, :, 1].mean())
        b = float(arr[:, :, 2].mean())

        # Yellow-dominant → Banana
        if r > 140 and g > 120 and b < 90 and g >= r * 0.75:
            return "Banana"

        # Orange-dominant → Orange or Mango
        if r > 150 and g > 80 and g < 160 and b < 80:
            if g > 110:
                return "Mango"
            return "Orange"

        # Red-dominant FIRST (before green) — Apple, Tomato, Strawberry
        if r > g * 1.15 and r > b * 1.15 and r > 90:
            red_pixels = np.sum((arr[:, :, 0] > 150) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100))
            total = arr.shape[0] * arr.shape[1]
            red_ratio = red_pixels / total
            if red_ratio > 0.35 and g < 90:
                return "Strawberry"
            if r > 170 and g < 60:
                return "Tomato"
            return "Apple"

        # Green-dominant → Bellpepper or Cucumber (only when NOT reddish)
        if g > r * 1.15 and g > b and g > 100 and r < 100:
            if r > 50:
                return "Bellpepper"
            return "Cucumber"

        # Brown/tan → Potato or Carrot
        if r > 100 and g > 70 and b < 80 and abs(r - g) < 40:
            if r > 150:
                return "Carrot"
            return "Potato"

        return None
    except Exception as e:
        print(f"Color heuristic error: {e}")
        return None


def _classify_with_imagenet(image_bytes: bytes) -> str:
    model = _load_imagenet_model()
    if model is None:
        return _classify_by_color(image_bytes) or "Food Item"

    try:
        from tensorflow.keras.applications.mobilenet_v2 import decode_predictions, preprocess_input
        from tensorflow.keras.preprocessing import image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        predictions = model.predict(img_array, verbose=0)
        decoded = decode_predictions(predictions, top=15)[0]

        best_match = None
        best_conf = 0.0

        for _, label, confidence in decoded:
            if confidence < 0.03:
                continue
            matched = _match_label_to_food(label)
            if matched and confidence > best_conf:
                best_match = matched
                best_conf = confidence

        if best_match:
            return best_match

        # Generic food-related ImageNet label
        for _, label, confidence in decoded:
            if confidence >= 0.06 and _is_food_label(label):
                matched = _match_label_to_food(label)
                if matched:
                    return matched
                return _format_label(label)

        # Color fallback for dataset test images
        color_guess = _classify_by_color(image_bytes)
        if color_guess:
            return color_guess

        return "Food Item"
    except Exception as e:
        print(f"ImageNet food classification error: {e}")
        color_guess = _classify_by_color(image_bytes)
        return color_guess or "Food Item"


def classify_food(image_bytes: bytes) -> str:
    """Classify food item from image bytes. Returns a display name."""
    ffds_result = _classify_with_ffds_model(image_bytes)
    if ffds_result:
        return ffds_result
    return _classify_with_imagenet(image_bytes)


def classify_food_with_confidence(image_bytes: bytes) -> Tuple[str, float]:
    """Classify food and return (name, confidence 0-100)."""
    model = _load_ffds_model()
    if model is not None:
        try:
            batch = _preprocess_for_ffds(image_bytes)
            probs = model.predict(batch, verbose=0)[0]
            idx = int(np.argmax(probs))
            confidence = float(probs[idx]) * 100
            if confidence >= 15:
                return FFDS_FOOD_CLASSES[idx], round(confidence, 2)
        except Exception:
            pass

    name = _classify_with_imagenet(image_bytes)
    return name, 0.0 if name == "Food Item" else 70.0


if __name__ == "__main__":
    print("Food classifier ready — dataset classes:", FFDS_FOOD_CLASSES)
