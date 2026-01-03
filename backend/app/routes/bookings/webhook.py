from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.config import settings
from app.services.csv_importer import CSVImporter  

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


def to_importer_row(payload: dict) -> dict:
    """
    Convert Google Sheets webhook payload into the exact dict shape
    your CSVImporter expects (the spreadsheet column headers).
    """
    return {
        "Timestamp": payload.get("timestamp", ""),  
        "Full Names": payload.get("fullNames", ""),
        "Email": payload.get("email", ""),
        "WhatsApp number": payload.get("cellNumber", ""),  
        "Type of Flight": payload.get("typeOfFlight", ""),
        "Departure Date": payload.get("departureDate", ""),
        "Vehicle Drop off Time ": payload.get("vehicleDropOffTime", ""),   
        "Arrival Date": payload.get("arrivalDate", ""),
        "Vehicle Pick -up Time ": payload.get("vehiclePickUpTime", ""),    
        "Vehicle Make and Model": payload.get("vehicleMakeAndModel", ""),
        "Vehicle Color": payload.get("vehicleColor", ""),
        "Vehicle Registration": payload.get("vehicleRegistration", ""),
        "Payment Method": payload.get("paymentMethod", ""),
        "Special Instructions": payload.get("specialInstructions", ""),
        "cost": str(payload.get("cost", "0")),  
    }


@router.post("/bookings/google-sheets")
def receive_google_sheets_booking(
    payload: dict,
    x_webhook_secret: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    
    print("Received webhook payload:", payload)
    # 1) Verify secret
    # if x_webhook_secret != settings.WEBHOOK_SECRET:
    #     raise HTTPException(status_code=401, detail="Invalid webhook secret")

    # 2) Validate required webhook fields
    row_number = payload.get("rowNumber")
    if not row_number:
        raise HTTPException(status_code=400, detail="rowNumber is required")

    # 3) Import using your existing logic
    importer = CSVImporter(db)
    row_dict = to_importer_row(payload)

    success, error = importer.import_row(
        row=row_dict,
        row_number=int(row_number),
        source="google_sheet",   
    )

    if not success:
        db.rollback()
        if error and "already exists" in error.lower():
            return {"status": "ok", "message": "duplicate_ignored", "rowNumber": row_number}

        raise HTTPException(status_code=400, detail=error or "Import failed")

    db.commit()
    return {"status": "ok", "message": "imported", "rowNumber": row_number}
