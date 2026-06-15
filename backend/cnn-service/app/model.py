"""Model loading singleton for FFDS CNN inference."""

import io
import os

import numpy as np
from PIL import Image

MODEL_PATH = os.getenv("MODEL_PATH", "./model/ffds_mobilenetv2.h5")

LABEL_MAP = {0: "Fresh", 1: "Borderline", 2: "Spoiled"}
CLASS_FOLDER_MAP = {"fresh": 0, "borderline": 1, "spoiled": 2}

_model = None
_model_loaded = False


def load_model():
    """Load the Keras model on startup."""
    global _model, _model_loaded
    if _model is not None:
        return _model

    try:
        import tensorflow as tf

        if os.path.exists(MODEL_PATH):
            _model = tf.keras.models.load_model(MODEL_PATH)
            _model_loaded = True
        else:
            _model = _create_fallback_model()
            _model_loaded = True
    except Exception:
        _model = None
        _model_loaded = False
    return _model


def _create_fallback_model():
    """Create a minimal untrained model when weights file is missing."""
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
    from tensorflow.keras.models import Model

    base = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights="imagenet")
    base.trainable = False
    x = GlobalAveragePooling2D()(base.output)
    out = Dense(3, activation="softmax")(x)
    return Model(inputs=base.input, outputs=out)


def is_model_loaded() -> bool:
    return _model_loaded and _model is not None


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Resize to 224x224 and normalize to [0, 1]."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def predict(image_bytes: bytes) -> dict:
    """
    Run inference on image bytes.
    Returns { foodType, label, confidence }.
    """
    model = load_model()
    if model is None:
        raise RuntimeError("Model not loaded")

    batch = preprocess_image(image_bytes)
    probs = model.predict(batch, verbose=0)[0]
    idx = int(np.argmax(probs))
    confidence = float(probs[idx] * 100)

    label = LABEL_MAP.get(idx, "Fresh")
    food_type = label

    return {
        "foodType": food_type,
        "label": label,
        "confidence": round(confidence, 2),
    }
