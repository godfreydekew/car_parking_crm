"""
Booking service for querying and retrieving bookings.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ...models import Booking, BookingStatus, FlightType, PaymentMethod


class BookingService:
    """Service for booking queries and retrieval operations."""

    @staticmethod
    def get_all(
        db: Session,
        status: Optional[BookingStatus] = None,
        payment_method: Optional[PaymentMethod] = None,
        flight_type: Optional[FlightType] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Booking]:
        """
        Get all bookings with optional filters.
        
        Args:
            db: Database session
            status: Filter by booking status
            payment_method: Filter by payment method
            flight_type: Filter by flight type
            search: Search in customer name, email, phone, or vehicle registration
            skip: Number of records to skip
            limit: Maximum number of records to return
        """
        query = db.query(Booking)
        
        # Apply filters
        if status:
            query = query.filter(Booking.status == status)
        
        if payment_method:
            query = query.filter(Booking.payment_method == payment_method)
        
        if flight_type:
            query = query.filter(Booking.flight_type == flight_type)
        
        # Search filter
        if search:
            from ...models import Customer, Vehicle
            search_term = f"%{search.lower()}%"
            query = query.join(Customer).join(Vehicle).filter(
                or_(
                    Customer.full_name.ilike(search_term),
                    Customer.email.ilike(search_term),
                    Customer.whatsapp_number.ilike(search_term),
                    Vehicle.registration.ilike(search_term),
                )
            )
        
        # Order by most recent first
        query = query.order_by(Booking.created_at.desc())
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, booking_id: int) -> Optional[Booking]:
        """Get a single booking by ID."""
        return db.query(Booking).filter(Booking.id == booking_id).first()

    @staticmethod
    def get_by_customer(db: Session, customer_id: int) -> List[Booking]:
        """Get all bookings for a specific customer."""
        return (
            db.query(Booking)
            .filter(Booking.customer_id == customer_id)
            .order_by(Booking.created_at.desc())
            .all()
        )

    @staticmethod
    def get_on_site(db: Session) -> List[Booking]:
        """Get all vehicles currently on site."""
        return (
            db.query(Booking)
            .filter(Booking.status.in_([BookingStatus.on_site, BookingStatus.overstay]))
            .order_by(Booking.checked_in_at.asc())
            .all()
        )

    @staticmethod
    def get_overstays(db: Session) -> List[Booking]:
        """Get all overstay bookings."""
        return (
            db.query(Booking)
            .filter(Booking.status == BookingStatus.overstay)
            .order_by(Booking.pickup_at.asc())
            .all()
        )

