"""
CSV Import API Routes

Endpoint for uploading and importing CSV booking data.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from ..db import get_db
from ..services.csv_importer import CSVImporter, CSVImportError

router = APIRouter(prefix="/api/csv", tags=["CSV Import"])


@router.post("/import", response_model=Dict)
async def import_csv_file(
    file: UploadFile = File(..., description="CSV file containing booking data"),
    db: Session = Depends(get_db),
):
    """
    Upload and import a CSV file containing booking data.
    
    The CSV file should have the following columns:
    - Timestamp
    - Full Names
    - Email
    - WhatsApp number
    - Type of Flight
    - Departure Date
    - Vehicle Drop off Time
    - Arrival Date
    - Vehicle Pick -up Time
    - Vehicle Make and Model
    - Vehicle Color
    - Vehicle Registration
    - Payment Method
    - Special Instructions
    - cost
    
    Returns statistics about the import process.
    """
    # Validate file type
    if not file.filename.endswith(('.csv', '.CSV')):
        raise HTTPException(
            status_code=400,
            detail="File must be a CSV file"
        )
    
    try:
        # Read file content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Create importer and import
        importer = CSVImporter(db)
        stats = importer.import_from_string(csv_content, source="api_upload")
        
        return {
            "message": "Import completed",
            "filename": file.filename,
            "statistics": {
                "total_rows": stats["total_rows"],
                "successful": stats["successful"],
                "failed": stats["failed"],
                "skipped": stats["skipped"],
            },
            "errors": stats["errors"][:50] if stats["errors"] else [],  # Limit to 50 errors
            "error_count": len(stats["errors"]),
        }
        
    except CSVImportError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File encoding error. Please ensure the file is UTF-8 encoded."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during import: {str(e)}"
        )


@router.get("/import/status")
async def get_import_status():
    """
    Get information about CSV import functionality.
    """
    return {
        "message": "CSV import endpoint is available",
        "supported_format": "CSV",
        "required_columns": [
            "Timestamp",
            "Full Names",
            "Email",
            "WhatsApp number",
            "Type of Flight",
            "Departure Date",
            "Vehicle Drop off Time",
            "Arrival Date",
            "Vehicle Pick -up Time",
            "Vehicle Make and Model",
            "Vehicle Color",
            "Vehicle Registration",
            "Payment Method",
            "Special Instructions",
            "cost",
        ],
    }

