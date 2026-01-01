"""
CSV Import Service for Airport CRM

Handles importing booking data from CSV files into the database.
Supports customer and vehicle deduplication.
"""
import csv
import re
from datetime import datetime, date, time
from typing import Optional, Dict, Tuple
from pathlib import Path
from io import StringIO

from sqlalchemy.orm import Session

from ..models import (
    Customer,
    Vehicle,
    Booking,
    FlightType,
    PaymentMethod,
    BookingStatus,
)


class CSVImportError(Exception):
    """Custom exception for CSV import errors"""
    pass


class CSVImporter:
    """
    Service class for importing CSV booking data.
    
    Important: Each CSV row creates a new Booking, even if it's from the same customer.
    Multiple bookings from the same customer are separate bookings, not duplicates.
    
    Customer and Vehicle entities are deduplicated (one record per unique email/phone
    or registration), but existing records are not modified.
    """

    def __init__(self, db: Session):
        self.db = db
        self.stats = {
            "total_rows": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": [],
        }

    def normalize_phone(self, phone: str) -> Optional[str]:
        """
        Normalize phone number by removing spaces and special characters.
        Keeps only digits and leading + sign.
        """
        if not phone or phone.strip() == "" or phone.upper() == "#ERROR!":
            return None
        
        # Remove all non-digit characters except +
        normalized = re.sub(r"[^\d+]", "", phone.strip())
        
        # Remove + if it's not at the start
        if normalized.startswith("+"):
            return normalized
        elif normalized:
            return normalized
        return None

    def normalize_email(self, email: str) -> Optional[str]:
        """Normalize and validate email"""
        if not email or email.strip() == "":
            return None
        
        email = email.strip().lower()
        
        # Basic validation - check for @
        if "@" in email and "." in email.split("@")[1]:
            return email
        return None

    def parse_date(self, date_str: str) -> Optional[date]:
        """
        Parse date from various formats:
        - DD/MM/YYYY
        - M/D/YYYY
        """
        if not date_str or date_str.strip() == "":
            return None
        
        date_str = date_str.strip()
        
        # Try DD/MM/YYYY format first (most common in CSV)
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            pass
        
        # Try M/D/YYYY format
        try:
            return datetime.strptime(date_str, "%m/%d/%Y").date()
        except ValueError:
            pass
        
        # Try YYYY-MM-DD
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            pass
        
        return None

    def parse_datetime(self, date_str: str, time_str: str) -> Optional[datetime]:
        """Parse date and time into datetime object"""
        date_obj = self.parse_date(date_str)
        if not date_obj:
            return None
        
        time_obj = self.parse_time(time_str)
        if not time_obj:
            # Default to midnight if time is missing
            time_obj = time(0, 0)
        
        return datetime.combine(date_obj, time_obj)

    def parse_time(self, time_str: str) -> Optional[time]:
        """Parse time from H:MM or HH:MM format"""
        if not time_str or time_str.strip() == "":
            return None
        
        time_str = time_str.strip()
        
        # Try H:MM or HH:MM format
        try:
            parts = time_str.split(":")
            if len(parts) == 2:
                hour = int(parts[0])
                minute = int(parts[1])
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return time(hour, minute)
        except (ValueError, IndexError):
            pass
        
        return None

    def parse_timestamp(self, timestamp_str: str) -> Optional[datetime]:
        """
        Parse booking creation timestamp.
        Format: M/D/YYYY H:MM:SS
        """
        if not timestamp_str or timestamp_str.strip() == "":
            return None
        
        timestamp_str = timestamp_str.strip()
        
        # Try M/D/YYYY H:MM:SS format
        try:
            return datetime.strptime(timestamp_str, "%m/%d/%Y %H:%M:%S")
        except ValueError:
            pass
        
        # Try DD/MM/YYYY H:MM:SS
        try:
            return datetime.strptime(timestamp_str, "%d/%m/%Y %H:%M:%S")
        except ValueError:
            pass
        
        # Try ISO format
        try:
            return datetime.fromisoformat(timestamp_str.replace(" ", "T"))
        except ValueError:
            pass
        
        return None

    def find_or_create_customer(
        self, full_name: str, email: Optional[str], whatsapp: Optional[str]
    ) -> Customer:
        """
        Find existing customer or create new one.
        Deduplication: match by email (primary) or phone (fallback).
        
        Note: Multiple bookings from the same customer are NOT duplicates.
        Each booking is separate. We only deduplicate the Customer entity itself.
        """
        # Normalize inputs
        normalized_email = self.normalize_email(email) if email else None
        normalized_whatsapp = self.normalize_phone(whatsapp) if whatsapp else None
        
        # Try to find by email first
        if normalized_email:
            customer = (
                self.db.query(Customer)
                .filter(Customer.email == normalized_email)
                .first()
            )
            if customer:
                # Return existing customer without modification
                # Multiple bookings from same customer are separate bookings
                return customer
        
        # Try to find by phone
        if normalized_whatsapp:
            customer = (
                self.db.query(Customer)
                .filter(Customer.whatsapp_number == normalized_whatsapp)
                .first()
            )
            if customer:
                # Return existing customer without modification
                # Multiple bookings from same customer are separate bookings
                return customer
        
        # Create new customer
        customer = Customer(
            full_name=full_name.strip(),
            email=normalized_email,
            whatsapp_number=normalized_whatsapp,
        )
        self.db.add(customer)
        return customer

    def find_or_create_vehicle(
        self, registration: str, make_model: str, color: Optional[str]
    ) -> Vehicle:
        """
        Find existing vehicle or create new one.
        Deduplication: match by registration (case-insensitive, normalized).
        
        Note: Same vehicle can be used in multiple bookings.
        We only deduplicate the Vehicle entity itself.
        """
        # Normalize registration (uppercase, remove extra spaces)
        normalized_reg = re.sub(r"\s+", " ", registration.strip().upper())
        
        # Try to find existing vehicle
        vehicle = (
            self.db.query(Vehicle)
            .filter(Vehicle.registration == normalized_reg)
            .first()
        )
        
        if vehicle:
            # Return existing vehicle without modification
            # Same vehicle can be used in multiple bookings
            return vehicle
        
        # Create new vehicle
        vehicle = Vehicle(
            registration=normalized_reg,
            make_model=make_model.strip(),
            color=color.strip() if color else None,
        )
        self.db.add(vehicle)
        return vehicle

    def parse_cost(self, cost_str: str) -> float:
        """Parse cost value, handling empty strings and invalid values"""
        if not cost_str or cost_str.strip() == "":
            return 0.0
        
        try:
            cost = float(cost_str.strip())
            return max(0.0, cost)  # Ensure non-negative
        except (ValueError, TypeError):
            return 0.0

    def import_row(self, row: Dict[str, str], row_number: int, source: str = "csv") -> Tuple[bool, Optional[str]]:
        """
        Import a single CSV row into the database.
        Returns (success, error_message)
        """
        try:
            # Extract and validate required fields
            full_name = row.get("Full Names", "").strip()
            if not full_name:
                return False, "Full name is required"
            
            # Parse timestamp (booking creation time)
            timestamp_str = row.get("Timestamp", "")
            created_at = self.parse_timestamp(timestamp_str)
            if not created_at:
                created_at = datetime.utcnow()  # Fallback to current time
            
            # Parse dates and times
            departure_date = row.get("Departure Date", "")
            dropoff_time = row.get("Vehicle Drop off Time ", "").strip()
            arrival_date = row.get("Arrival Date", "")
            pickup_time = row.get("Vehicle Pick -up Time ", "").strip()
            
            dropoff_at = self.parse_datetime(departure_date, dropoff_time)
            pickup_at = self.parse_datetime(arrival_date, pickup_time)
            
            if not dropoff_at:
                return False, f"Invalid dropoff date/time: {departure_date} {dropoff_time}"
            if not pickup_at:
                return False, f"Invalid pickup date/time: {arrival_date} {pickup_time}"
            
            if pickup_at <= dropoff_at:
                return False, "Pickup time must be after dropoff time"
            
            # Parse flight type
            flight_type_str = row.get("Type of Flight", "").strip().lower()
            if flight_type_str == "international":
                flight_type = FlightType.international
            elif flight_type_str == "domestic":
                flight_type = FlightType.domestic
            else:
                return False, f"Invalid flight type: {flight_type_str}"
            
            # Parse payment method
            payment_str = row.get("Payment Method", "").strip().lower()
            if payment_str == "eft":
                payment_method = PaymentMethod.eft
            elif payment_str == "cash":
                payment_method = PaymentMethod.cash
            else:
                payment_method = PaymentMethod.cash  # Default
            
            # Get customer and vehicle
            email = row.get("Email", "")
            whatsapp = row.get("WhatsApp number", "")
            customer = self.find_or_create_customer(full_name, email, whatsapp)
            
            registration = row.get("Vehicle Registration", "").strip()
            make_model = row.get("Vehicle Make and Model", "").strip()
            color = row.get("Vehicle Color", "").strip()
            
            if not registration:
                return False, "Vehicle registration is required"
            if not make_model:
                return False, "Vehicle make/model is required"
            
            vehicle = self.find_or_create_vehicle(registration, make_model, color)
            
            # Flush to get IDs for customer and vehicle
            self.db.flush()
            
            # Check if booking already exists (by source and row identifier)
            source_row_id = f"row_{row_number}"
            existing_booking = (
                self.db.query(Booking)
                .filter(
                    Booking.source == source,
                    Booking.source_row_id == source_row_id,
                )
                .first()
            )
            
            if existing_booking:
                return False, "Booking already exists (duplicate row)"
            
            # Parse cost
            cost = self.parse_cost(row.get("cost", "0"))
            
            # Get special instructions
            special_instructions = row.get("Special Instructions", "").strip()
            if not special_instructions or special_instructions.lower() in ["none", "no", "na", ""]:
                special_instructions = None
            
            # Create booking
            booking = Booking(
                source=source,
                source_row_id=source_row_id,
                customer_id=customer.id,
                vehicle_id=vehicle.id,
                flight_type=flight_type,
                dropoff_at=dropoff_at,
                pickup_at=pickup_at,
                payment_method=payment_method,
                special_instructions=special_instructions,
                cost=cost,
                status=BookingStatus.booked,
                created_at=created_at,
            )
            
            self.db.add(booking)
            self.db.flush()
            
            return True, None
            
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"

    def import_from_file(self, file_path: Path, source: str = "csv") -> Dict:
        """
        Import bookings from a CSV file.
        Returns statistics dictionary.
        """
        self.stats = {
            "total_rows": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": [],
        }
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                # Detect delimiter, default to comma if detection fails
                sample = f.read(1024)
                f.seek(0)
                delimiter = ","
                try:
                    sniffer = csv.Sniffer()
                    delimiter = sniffer.sniff(sample).delimiter
                except (csv.Error, AttributeError):
                    # Default to comma if delimiter detection fails
                    delimiter = ","
                
                reader = csv.DictReader(f, delimiter=delimiter)
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
                    self.stats["total_rows"] += 1
                    
                    # Skip empty rows
                    if not any(row.values()):
                        self.stats["skipped"] += 1
                        continue
                    
                    success, error = self.import_row(row, row_num, source)
                    
                    if success:
                        self.stats["successful"] += 1
                    else:
                        self.stats["failed"] += 1
                        self.stats["errors"].append({
                            "row": row_num,
                            "error": error,
                            "data": {k: v for k, v in row.items() if k},
                        })
            
            # Commit all successful imports
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            raise CSVImportError(f"Failed to import CSV file: {str(e)}")
        
        return self.stats

    def import_from_string(self, csv_content: str, source: str = "csv") -> Dict:
        """
        Import bookings from CSV content string.
        Returns statistics dictionary.
        """
        self.stats = {
            "total_rows": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": [],
        }
        
        try:
            # Use StringIO to treat string as file
            f = StringIO(csv_content)
            
            # Detect delimiter, default to comma if detection fails
            sample = f.read(1024)
            f.seek(0)
            delimiter = ","
            try:
                sniffer = csv.Sniffer()
                delimiter = sniffer.sniff(sample).delimiter
            except (csv.Error, AttributeError):
                # Default to comma if delimiter detection fails
                delimiter = ","
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
                self.stats["total_rows"] += 1
                
                # Skip empty rows
                if not any(row.values()):
                    self.stats["skipped"] += 1
                    continue
                
                success, error = self.import_row(row, row_num, source)
                
                if success:
                    self.stats["successful"] += 1
                else:
                    self.stats["failed"] += 1
                    self.stats["errors"].append({
                        "row": row_num,
                        "error": error,
                        "data": {k: v for k, v in row.items() if k},
                    })
            
            # Commit all successful imports
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            raise CSVImportError(f"Failed to import CSV content: {str(e)}")
        
        return self.stats

