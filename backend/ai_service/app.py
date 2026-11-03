import json
import os
from pathlib import Path
from typing import Any

import requests
from flask import Flask, jsonify, request
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = Flask(__name__)

SUPPORTED_TYPES = {"mcq", "matching", "fill_in_the_blanks"}
DIFFICULTIES = {"easy", "medium", "hard"}


def normalize_lesson_content(value: Any) -> str:
    if isinstance(value, dict):
        data = value
    elif isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return " ".join(value.split())
        if not isinstance(parsed, dict):
            return " ".join(value.split())
        data = parsed
    else:
        return ""

    pieces: list[str] = []

    def collect(item: Any) -> None:
        if isinstance(item, str) and item.strip():
            pieces.append(item.strip())
        elif isinstance(item, list):
            for entry in item:
                collect(entry)
        elif isinstance(item, dict):
            for key in ("title", "text", "content", "explanation", "word", "definition"):
                collect(item.get(key))

    for field in ("summary", "intro", "paragraphs", "examples", "keyIdea", "keyWords"):
        collect(data.get(field))
    return "\n".join(pieces)

def usable_activity(activity: Any, activity_type: str) -> bool:
    if not isinstance(activity, dict):
        return False
    if activity_type == "mcq":
        return bool(activity.get("question") and isinstance(activity.get("options"), list)
                    and len(activity["options"]) >= 2 and activity.get("correctAnswer"))
    if activity_type == "matching":
        pairs = activity.get("pairs")
        return bool(isinstance(pairs, list) and pairs and all(
            isinstance(pair, dict) and pair.get("left") and pair.get("right") for pair in pairs
        ))
    if activity_type == "fill_in_the_blanks":
        parts = activity.get("parts")
        return bool(isinstance(parts, list) and parts and any(
            isinstance(part, dict) and part.get("blankId") for part in parts
        ) and isinstance(activity.get("wordBank"), list) and activity["wordBank"])
    return False

def call_openai_compatible_service(payload: dict[str, Any]) -> dict[str, Any] | None:
    url = os.getenv("AI_PROVIDER_URL")
    api_key = os.getenv("AI_PROVIDER_API_KEY")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")
    if not url or not api_key:
        return None

    schemas = {
        "mcq": '{"title":"...","type":"mcq","difficulty":"...","question":"...","options":["...","...","..."],"correctAnswer":"exact option text","explanation":"..."}',
        "matching": '{"title":"...","type":"matching","difficulty":"...","pairs":[{"left":"...","right":"..."},{"left":"...","right":"..."},{"left":"...","right":"..."}],"explanation":"..."}',
        "fill_in_the_blanks": '{"title":"...","type":"fill_in_the_blanks","difficulty":"...","question":"...","wordBank":["...","...","..."],"parts":[{"text":"..."},{"blankId":"b1","correctAnswer":"..."},{"text":"..."}],"explanation":"..."}'
    }
    type_rules = {
        "mcq": "Write one clear question with exactly three distinct answer options and exactly one correct answer. correctAnswer must exactly match one option.",
        "matching": "Write exactly three simple, unambiguous pairs. Each left item must match only its corresponding right item.",
        "fill_in_the_blanks": "Write one complete sentence split into text parts around exactly one blank. Put the missing word in correctAnswer and include it exactly once in a three-word wordBank."
    }
    prompt = (
        "You are a careful primary-school learning activity writer for children aged 6 to 12. "
        "Create one useful activity that teaches or checks one important idea from the lesson. "
        "Use only facts stated in the lesson text; never treat formatting, labels, or metadata as lesson facts. "
        "Use short, age-appropriate wording and make the answer unambiguous. "
        "For easy difficulty, check recognition or recall; for medium, check understanding; for hard, check a simple application or inference that is still supported by the lesson. "
        f"Activity-specific requirement: {type_rules[payload['type']]} "
        f"Return exactly one JSON object matching this schema: {schemas[payload['type']]}. "
        f"Use this activity title: {payload.get('title') or 'Learning activity'}. "
        f"Type: {payload['type']}. Difficulty: {payload['difficulty']}. "
        f"Lesson text follows:\n{payload['lessonContent']}"
    )
    endpoint = url.rstrip("/")
    if not endpoint.endswith("/chat/completions"):
        endpoint += "/chat/completions"

    response = requests.post(
        endpoint,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "temperature": 0.2,
            "max_tokens": 800,
            "reasoning": {"enabled": False},
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=(5, 45),
    )
    response.raise_for_status()
    message = response.json()["choices"][0]["message"]
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Provider returned no activity text")
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`").strip()
        if content.lower().startswith("json"):
            content = content[4:].strip()
    return json.loads(content)


@app.post("/generate-activity")
def generate_activity():
    payload = request.get_json(silent=True) or {}
    lesson_content = normalize_lesson_content(payload.get("lessonContent", ""))
    activity_type = payload.get("type")
    difficulty = payload.get("difficulty", "easy")
    payload["lessonContent"] = lesson_content
    if not lesson_content or activity_type not in SUPPORTED_TYPES or difficulty not in DIFFICULTIES:
        return jsonify({"message": "lessonContent, type, and difficulty are required"}), 400

    try:
        activity = call_openai_compatible_service(payload)
        if not usable_activity(activity, activity_type):
            raise ValueError("Provider returned an incomplete activity")
    except requests.Timeout as error:
        app.logger.warning("AI provider timed out (%s)", type(error).__name__)
        return jsonify({"message": "The AI provider timed out. No activity draft was created."}), 503
    except requests.HTTPError as error:
        status = error.response.status_code if error.response is not None else 502
        app.logger.warning("AI provider rejected the request (HTTP %s)", status)
        return jsonify({"message": f"The AI provider rejected the request (HTTP {status}). Check the model name and provider settings."}), 502
    except requests.RequestException as error:
        app.logger.warning("AI provider connection failed (%s)", type(error).__name__)
        return jsonify({"message": "The AI provider could not be reached. No activity draft was created."}), 503
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as error:
        app.logger.warning("AI provider returned invalid activity data (%s)", type(error).__name__)
        return jsonify({"message": "The AI model returned an invalid activity. No draft was created."}), 502
    activity["type"] = activity_type
    activity["difficulty"] = difficulty
    return jsonify({"activity": activity, "source": "ai-provider"})
@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.getenv("PORT") or os.getenv("AI_PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
