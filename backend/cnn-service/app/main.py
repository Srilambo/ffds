"""FFDS CNN Inference Service — FastAPI application."""

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from app import model as model_module

app = FastAPI(title="FFDS CNN Service", version="1.0.0")


@app.on_event("startup")
async def startup_event():
    model_module.load_model()


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model_module.is_model_loaded()}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "File must be an image"})

    image_bytes = await file.read()
    try:
        result = model_module.predict(image_bytes)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
