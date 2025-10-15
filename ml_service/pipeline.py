# ------------------------------------------------
# pipeline.py — Emotion Classification + OpenAI Support Generator
# ------------------------------------------------
import os
import re
import json
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from openai import OpenAI


# ------------------------------------------------
# 1️⃣ Load fine-tuned DistilBERT emotion model
# ------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "../fine_tuned_emotion_model_revised")

if not os.path.isdir(model_path):
    raise FileNotFoundError(
        f"❌ Model directory not found: {model_path}\n"
        f"Ensure model files exist in: {model_path}"
    )

print(f"✅ Loading emotion model from: {model_path}")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(model_path, local_files_only=True)
model.eval()

labels = ["sadness", "joy", "love", "anger", "fear", "surprise"]


def classify_emotion(text: str):
    """Run emotion classification on journal text."""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=-1).squeeze()
    top_id = torch.argmax(probs).item()
    return labels[top_id], {labels[i]: float(probs[i]) for i in range(len(labels))}


# ------------------------------------------------
# 2️⃣ Resource cleaner (placeholder)
# ------------------------------------------------
def clean_resources(resources):
    return []


# ------------------------------------------------
# 3️⃣ OpenAI setup
# ------------------------------------------------
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if not openai_api_key:
    raise EnvironmentError("❌ OPENAI_API_KEY not set in environment variables.")

client = OpenAI(api_key=openai_api_key)


# ------------------------------------------------
# 4️⃣ Structured output schema
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
  Include this block:

"actions": {{
  "suggest_breathing_timer": true or false,
  "recommended_duration": integer,
  "cycle_type": "inhale_exhale" or "box_breathing" or "none",
  "user_confirmation_required": true
}}

Only suggest breathing if relevant (e.g., fear, anxiety). 
If not, set "suggest_breathing_timer": false.

Respond ONLY in valid JSON format:
{format_instructions}
""")


# ------------------------------------------------
# 5️⃣ Support generator using OpenAI
# ------------------------------------------------
def generate_support(emotion: str, text: str):
    """Generate structured, supportive response using OpenAI."""
    _input = prompt.format_prompt(
        emotion=emotion,
        text=text,
        format_instructions=format_instructions
    )

    prompt_text = _input.to_string()
    response_text = None

    try:
        chat = client.chat.completions.create(
            model=openai_model,
            messages=[
                {"role": "system", "content": "You are a compassionate mental-health assistant."},
                {"role": "user", "content": prompt_text},
            ],
            max_tokens=300,
        )
        response_text = chat.choices[0].message.content
    except Exception as e:
        print("❌ OpenAI API call failed:", e)
        return {
            "support_message": f"I'm here for you. Remember, your feelings of {emotion} are valid.",
            "activities": ["Take a short walk", "Write down your thoughts", "Practice mindful breathing"],
            "actions": {
                "suggest_breathing_timer": emotion in ["fear", "anger", "sadness"],
                "recommended_duration": 60,
                "cycle_type": "inhale_exhale",
                "user_confirmation_required": True,
            },
            "resources": [],
        }

    # Parse the JSON-like response
    try:
        cleaned = re.sub(r"```json|```", "", response_text).strip()
        cleaned = re.sub(r"//.*", "", cleaned)
        parsed = output_parser.parse(cleaned)
        parsed["resources"] = clean_resources(parsed.get("resources", []))
        return parsed
    except Exception as e:
        print("⚠️ JSON parsing failed:", e)
        return {"error": str(e), "raw_response": response_text}


# ------------------------------------------------
# 6️⃣ Full pipeline wrapper
# ------------------------------------------------
def emotion_support_pipeline(user_text: str):
    """Complete pipeline: emotion classification + support generation."""
    emotion, probs = classify_emotion(user_text)
    support = generate_support(emotion, user_text)
    return {
        "text": user_text,
        "predicted_emotion": emotion,
        "probabilities": probs,
        "support_plan": support,
    }


# ------------------------------------------------
# 7️⃣ Local test
# ------------------------------------------------
if __name__ == "__main__":
    text = "I feel anxious and overwhelmed before my exam."
    result = emotion_support_pipeline(text)
    print(json.dumps(result, indent=2))
