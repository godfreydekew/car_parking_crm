import logging
import re
from sqlalchemy import text
from sqlalchemy.orm import Session
from .gemini_client import generate_sql, interpret_results

logger = logging.getLogger(__name__)

MAX_ROWS = 100

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
      3. Gemini interprets the results into a human-friendly response

    If Gemini returns a conversational reply instead of SQL,
    return it directly without executing anything.

    Returns a dict with: answer, sql_used, row_count
    """
    # Step 1: Generate SQL
    sql = generate_sql(user_message, history)
    logger.info("Generated SQL: %s", sql)

    if not _looks_like_sql(sql):
        logger.info("Non-SQL response from model, returning as-is")
        return {
            "answer": sql,
            "sql_used": None,
            "row_count": 0,
        }

    rows, row_count = _execute_query(db, sql)

    answer = interpret_results(user_message, sql, rows)

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