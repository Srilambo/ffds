"""Safe Keras model loading across TensorFlow / Keras versions."""

from __future__ import annotations

import os
from typing import Any, Callable, Optional


def _patched_initializers():
    import tensorflow as tf

    class PatchedGlorotUniform(tf.keras.initializers.GlorotUniform):
        def __init__(self, *args, **kwargs):
            kwargs.pop("input_axes", None)
            kwargs.pop("output_axes", None)
            super().__init__(*args, **kwargs)

    class PatchedGlorotNormal(tf.keras.initializers.GlorotNormal):
        def __init__(self, *args, **kwargs):
            kwargs.pop("input_axes", None)
            kwargs.pop("output_axes", None)
            super().__init__(*args, **kwargs)

    return {
        "GlorotUniform": PatchedGlorotUniform,
        "GlorotNormal": PatchedGlorotNormal,
    }


def safe_load_model(
    path: str,
    *,
    rebuild_fn: Optional[Callable[[], Any]] = None,
    label: str = "model",
) -> Optional[Any]:
    """
    Load a Keras model from *path* with version-tolerant deserializers.
    Falls back to *rebuild_fn* + load_weights when full deserialization fails.
    """
    if not path or not os.path.exists(path):
        print(f"[keras_loader] {label}: file not found at {path}")
        return None

    import tensorflow as tf

    custom_objects = _patched_initializers()

    try:
        model = tf.keras.models.load_model(
            path,
            compile=False,
            custom_objects=custom_objects,
            safe_mode=False,
        )
        print(f"[keras_loader] {label}: loaded from {path}")
        return model
    except TypeError:
        # Older TensorFlow builds do not accept safe_mode.
        try:
            model = tf.keras.models.load_model(
                path,
                compile=False,
                custom_objects=custom_objects,
            )
            print(f"[keras_loader] {label}: loaded from {path}")
            return model
        except Exception as exc:
            print(f"[keras_loader] {label}: load failed ({exc})")
    except Exception as exc:
        print(f"[keras_loader] {label}: load failed ({exc})")

    if rebuild_fn is None:
        return None

    try:
        model = rebuild_fn()
        model.load_weights(path)
        print(f"[keras_loader] {label}: rebuilt architecture and loaded weights from {path}")
        return model
    except Exception as exc:
        print(f"[keras_loader] {label}: weight load failed ({exc})")
        return None
