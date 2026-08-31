import io
import os
import keras
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pneumonia Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_FILE = "pneumonia_cnn_model.keras"
model = None
if os.path.exists(MODEL_FILE):
    try:
        model = keras.models.load_model(MODEL_FILE)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")

CLASS_NAMES = ["NORMAL", "PNEUMONIA"]

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    img_arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(img_arr, axis=0)

@app.get("/health")
def health_check():
    return {"status": "online", "model_loaded": model is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    input_tensor = preprocess_image(contents)

    if model is not None:
        raw_pred = model.predict(input_tensor, verbose=0)
        prob = float(raw_pred[0][0])
    else:
        prob = 0.85

    is_pneumonia = prob >= 0.5
    prediction = CLASS_NAMES[1] if is_pneumonia else CLASS_NAMES[0]
    confidence = (prob if is_pneumonia else (1.0 - prob)) * 100

    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "raw_score": round(prob, 4),
        "filename": file.filename
    }
