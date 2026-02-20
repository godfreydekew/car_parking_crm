import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from .gemini_client import generate_sql, interpret_results

logger = logging.getLogger(__name__)

MAX_ROWS = 100

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

    Returns a dict with: answer, sql_used, row_count
    """
    # Step 1: Generate SQL
    sql = generate_sql(user_message, history)
    logger.info("Generated SQL: %s", sql)

    # Step 2: Execute SQL
    rows, row_count = _execute_query(db, sql)

    # Step 3: Interpret results
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