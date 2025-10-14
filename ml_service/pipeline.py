# pipeline.py

import os
import re
import json
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from langchain_community.llms import Ollama
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema

# ------------------------------------------------
# Load fine-tuned DistilBERT (already exported)
# ------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # current folder
model_path = os.path.join(BASE_DIR, "../fine_tuned_emotion_model_revised")

if not os.path.isdir(model_path):
    raise FileNotFoundError(f"❌ Model directory not found: {model_path}\n"
                            f"Make sure you exported the model here.")

print(f"✅ Loading model from: {model_path}")
print("Contents:", os.listdir(model_path))

tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(model_path, local_files_only=True)
model.eval()

labels = ["sadness", "joy", "love", "anger", "fear", "surprise"]

def classify_emotion(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=-1).squeeze()
    top_id = torch.argmax(probs).item()
    return labels[top_id], {labels[i]: float(probs[i]) for i in range(len(labels))}

# ------------------------------------------------
# Resource cleaner
# ------------------------------------------------
def clean_resources(resources):
    return []

# ------------------------------------------------
# LLM via Ollama (Mistral)
# ------------------------------------------------
llm = Ollama(model="mistral")

# ------------------------------------------------
# JSON output schema
# ------------------------------------------------
response_schemas = [
    ResponseSchema(name="support_message", description="A supportive message for the user"),
    ResponseSchema(name="activities", description="A list of exactly 3 helpful activities", type="list"),
    ResponseSchema(name="actions", description="Breathing timer or other assistive actions", type="object"),
]

output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
format_instructions = output_parser.get_format_instructions()

prompt = ChatPromptTemplate.from_template("""
The user is experiencing {emotion}.
Their journal entry: "{text}"

Please:
- Provide a short, supportive message
- Suggest exactly 3 practical activities
- If applicable, recommend a breathing timer, but DO NOT assume it will be used.
  Instead, include this block:

"actions": {{
  "suggest_breathing_timer": true or false,
  "recommended_duration": integer,
  "cycle_type": "inhale_exhale" or "box_breathing" or "none",
  "user_confirmation_required": true
}}

Only suggest breathing if relevant (e.g. fear, anxiety). If not, set "suggest_breathing_timer": false.

Respond ONLY in JSON format:
{format_instructions}
""")

def generate_support(emotion: str, text: str):
    _input = prompt.format_prompt(
        emotion=emotion,
        text=text,
        format_instructions=format_instructions
    )
    response = llm(_input.to_string())

    try:
        # Remove triple backticks and comments
        cleaned = re.sub(r"```json|```", "", response).strip()
        cleaned = re.sub(r"//.*", "", cleaned)
        parsed = output_parser.parse(cleaned)
        parsed["resources"] = clean_resources(parsed.get("resources", []))
        return parsed
    except Exception as e:
        return {"error": str(e), "raw_response": response}

def emotion_support_pipeline(user_text: str):
    emotion, probs = classify_emotion(user_text)
    support = generate_support(emotion, user_text)
    return {
        "text": user_text,
        "predicted_emotion": emotion,
        "probabilities": probs,
        "support_plan": support
    }

if __name__ == "__main__":
    text = "I feel anxious and overwhelmed before my exam."
    result = emotion_support_pipeline(text)
    print(json.dumps(result, indent=2))

