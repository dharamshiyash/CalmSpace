from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
from typing import Optional

# Import the richer pipeline which generates support plan
try:
  from .pipeline import emotion_support_pipeline
except Exception:
  # Fallback for direct execution
  from pipeline import emotion_support_pipeline

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your saved model
model_path = "../fine_tuned_emotion_model_revised"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)
model.eval()

labels = ["sadness", "joy", "love", "anger", "fear", "surprise"]

class Request(BaseModel):
    text: str

@app.post("/predict")
async def predict(req: Request):
    inputs = tokenizer(req.text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=-1).squeeze()
    top_id = torch.argmax(probs).item()
    return {
        "text": req.text,
        "prediction": labels[top_id],
        "probabilities": {labels[i]: float(probs[i]) for i in range(len(labels))}
    }


# Extended endpoint: returns predicted emotion and supportive response plan
class SupportRequest(BaseModel):
    text: str
    mood: Optional[str] = None


@app.post("/support")
async def support(req: SupportRequest):
    # Current pipeline computes its own predicted emotion from text.
    # We pass only text; mood can be used in the future revisions if needed.
    result = emotion_support_pipeline(req.text)
    # Ensure a stable shape for frontend consumption
    return {
        "text": result.get("text"),
        "prediction": result.get("predicted_emotion"),
        "probabilities": result.get("probabilities", {}),
        "support_plan": result.get("support_plan", {})
    }