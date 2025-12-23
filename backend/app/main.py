from .config import settings
from .db import create_tables
from fastapi import FastAPI
from typing import Union

app = FastAPI(title="Airport CRM Backend")


# Create tables on startup before handling requests
@app.on_event("startup")
def on_startup():
    if settings.AUTO_CREATE_TABLES:
        create_tables()

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.ENV}