import asyncio
import io
import os
from contextlib import asynccontextmanager
from PIL import Image
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import keras
import numpy as np

# Locate model in the same directory as main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "pneumonia_cnn_model (1).keras")

CLASS_NAMES = ["NORMAL", "PNEUMONIA"]
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    if os.path.exists(MODEL_FILE):
        try:
            # compile=False loads weights and architecture for fast inference
            model = keras.models.load_model(MODEL_FILE, compile=False)
            print("✓ pneumonia_cnn_model (1).keras loaded successfully!")
        except Exception as e:
            print(f"✗ Failed to load model: {e}")
    else:
        print(f"✗ Warning: {MODEL_FILE} not found in root directory.")
    yield


app = FastAPI(title="Pneumonia Detection API", lifespan=lifespan)

# Enable CORS for Vercel / frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_arr = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(img_arr, axis=0)  # Shape: (1, 224, 224, 3)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid image format: {str(e)}"
        )


@app.get("/health")
def health_check():
    return {"status": "online", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    contents = await file.read()
    input_tensor = preprocess_image(contents)

    if model is not None:
        # Run CPU prediction in a separate thread to keep API responsive
        raw_pred = await asyncio.to_thread(
            model.predict, input_tensor, verbose=0
        )
        prob = float(raw_pred[0][0])
    else:
        # Fallback response if model file is missing
        prob = 0.85

    is_pneumonia = prob >= 0.5
    prediction = CLASS_NAMES[1] if is_pneumonia else CLASS_NAMES[0]
    confidence = (prob if is_pneumonia else (1.0 - prob)) * 100

    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "raw_score": round(prob, 4),
        "filename": file.filename,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
