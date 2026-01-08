#import API ROUTE
# SET UP RESET AND DROP AND CREATE ROUTES
from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

router = APIRouter(prefix="/api/db", tags=["Database Management"])

@router.delete("/reset", summary="Reset the database")
def reset_database():
    """
    Reset the database by dropping all tables and recreating them.
    """
    from ...db import drop_tables, create_tables

    try:  
        drop_tables()
        create_tables()
        return {"message": "Database has been reset."}
    except HTTPException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset database: {str(e)}"
            )
@router.delete("/drop", summary="Drop all database tables")
def drop_database():
    """
    Drop all tables in the database.
    """
    from ...db import drop_tables

    try:
        drop_tables()
        return {"message": "All database tables have been dropped."}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to drop database tables: {str(e)}"
            )
        
@router.post("/create", summary="Create database tables")
def create_database():
    """
    Create all tables in the database.
    """
    from ...db import create_tables

    try:
        create_tables()
        return {"message": "Database tables have been created."}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create database tables: {str(e)}"
            )

