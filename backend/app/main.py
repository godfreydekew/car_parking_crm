"""
FastAPI application entry point for Airport CRM Backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import create_tables
from .routes.csv import csv_import
from .routes.bookings import booking_routes
from .routes.bookings import webhook
from .routes.db_management import database_routes


app = FastAPI(
    title="Airport CRM Backend",
    description="Backend API for airport parking CRM system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(csv_import.router)
app.include_router(booking_routes.router)
app.include_router(webhook.router)
app.include_router(database_routes.router)


@app.on_event("startup")
def on_startup():
    """Create database tables on application startup."""
    if settings.AUTO_CREATE_TABLES:
        create_tables()


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "env": settings.ENV}

@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Welcome to the Airport CRM Backend API"}