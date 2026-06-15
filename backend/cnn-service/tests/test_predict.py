"""Tests for CNN inference service."""

import io

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def _make_test_image() -> bytes:
    arr = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data


def test_predict_returns_correct_shape():
    image_bytes = _make_test_image()
    response = client.post(
        "/predict",
        files={"file": ("test.jpg", image_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "foodType" in data
    assert data["label"] in ("Fresh", "Borderline", "Spoiled")
    assert isinstance(data["confidence"], (int, float))
    assert 0 <= data["confidence"] <= 100
