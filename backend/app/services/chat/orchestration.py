import logging
import re
from sqlalchemy import text
from sqlalchemy.orm import Session
from .openai_client import generate_sql, interpret_results

logger = logging.getLogger(__name__)

MAX_ROWS = 100

_GREETING_RESPONSES = {
    "hi": "Hi! How can I help you today? Ask me about bookings, customers, or operations.",
    "hello": "Hello! I'm your parking assistant. What would you like to know?",
    "hey": "Hey! How can I assist you?",
    "thanks": "You're welcome! Let me know if you need anything else.",
    "thank you": "You're welcome! Happy to help.",
}
_SQL_PATTERN = re.compile(
    r"^\s*(SELECT|DELETE|WITH)\b", re.IGNORECASE
)


def _looks_like_sql(response: str) -> bool:
    return bool(_SQL_PATTERN.match(response))


def handle_chat(
    db: Session,
    user_message: str,
    history: list[dict],
) -> dict:
    """
    Orchestrates the full chat flow:
      1. Gemini generates SQL from the user message
      2. SQLAlchemy executes the SQL on Supabase
      3. OpenAI interprets the results into a human-friendly response

    If the model returns a conversational reply instead of SQL,
    return it directly without executing anything.

    Returns a dict with: answer, sql_used, row_count
    """
    # Fast path for simple greetings — instant response, no API call
    msg_clean = user_message.strip().lower().rstrip("!?.")
    if len(msg_clean) < 25 and msg_clean in _GREETING_RESPONSES:
        return {
            "answer": _GREETING_RESPONSES[msg_clean],
            "sql_used": None,
            "row_count": 0,
        }

    # Step 1: Generate SQL
    sql = generate_sql(user_message, history)
    print("SQL generated")
    logger.info("Generated SQL: %s", sql)
    print("SQL: ", sql)

    if not _looks_like_sql(sql):
        logger.info("Non-SQL response from model, returning as-is")
        return {
            "answer": sql,
            "sql_used": None,
            "row_count": 0,
        }

    try:
        rows, row_count = _execute_query(db, sql)
    except Exception as e:
        logger.exception("SQL execution failed")
        return {
            "answer": f"I ran into a database error: {str(e)}. Please try rephrasing your question.",
            "sql_used": sql,
            "row_count": 0,
        }

    answer = interpret_results(user_message, sql, rows)
    print("Answer: ", answer)
    return {
        "answer": answer,
        "sql_used": sql,
        "row_count": row_count,
    }

def _execute_query(db: Session, sql: str) -> tuple[list[dict], int]:
    result = db.execute(text(sql))

    if result.returns_rows:
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchmany(MAX_ROWS)]
        return rows, len(rows)

    db.commit()
    return [], result.rowcount