import google.generativeai as genai
from .schema_context import SCHEMA_CONTEXT
from app.config import settings

gemini_api_key = settings.GEMINI_API_KEY
genai.configure(api_key=gemini_api_key)

_model = genai.GenerativeModel('gemini-2.0-flash')

def generate_sql(user_message: str, history: list[dict]) -> str:
    
    conversation = _build_history(history)

    prompt = (
        f"{SCHEMA_CONTEXT}\n\n"
        f"Conversation so far:\n{conversation}\n\n"
        f"User: {user_message}\n\n"
        "Generate the SQL query now:"
    )

    response = _model.generate_content(prompt)
    sql = response.text.strip()

    if sql.startswith("```"):
        sql = sql.split("\n", 1)[-1]
        sql = sql.rsplit("```", 1)[0].strip()

    return sql

def interpret_results(user_message: str, sql: str, results: list[dict]) -> str:

    prompt = (
        "You are a helpful CRM assistant for an airport parking company.\n\n"
        f"The user asked: {user_message}\n\n"
        f"We ran this SQL query:\n{sql}\n\n"
        f"The query returned these results:\n{results}\n\n"
        "Summarise the results in a clear, friendly, concise response. "
        "Do not mention SQL. If results are empty, say so politely."
        "If the user aske follow up questions, answer them in a friendly, concise manner. Do not mention SQL."
        "If the user asks for a report, generate a report in a clear, friendly, concise manner. Do not mention SQL."
        "The currency is South African Rand (ZAR)."
        "If the user say Thank you, say you're welcome. Do not mention SQL."
    )

    response = _model.generate_content(prompt)
    return response.text.strip()

def _build_history(history: list[dict]) -> str:
    if not history:
        return "None"
    lines = []
    for msg in history[-6:]: 
        role = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)