from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal


BookingStatus = Literal["BOOKED", "ON_SITE", "COLLECTED", "OVERSTAY", "CANCELLED", "NO_SHOW"]
FlightType = Literal["domestic", "international"]
PaymentMethod = Literal["cash", "eft", "card", "other"]


# ---------- Customers ----------
class CustomerBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    whatsapp_number: Optional[str] = Field(default=None, max_length=40)


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Vehicles ----------
class VehicleBase(BaseModel):
    registration: str = Field(min_length=2, max_length=32)
    make_model: str = Field(min_length=2, max_length=120)
    color: Optional[str] = Field(default=None, max_length=50)


class VehicleCreate(VehicleBase):
    pass


class VehicleOut(VehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Bookings ----------
class BookingBase(BaseModel):
    flight_type: FlightType
    dropoff_at: datetime
    pickup_at: datetime
    payment_method: PaymentMethod = "cash"
    special_instructions: Optional[str] = None
    cost: float = Field(ge=0)


class BookingCreate(BookingBase):
    customer: CustomerCreate
    vehicle: VehicleCreate
    source: str = "manual"
    source_row_id: Optional[str] = None


class BookingUpdate(BaseModel):
    pickup_at: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    special_instructions: Optional[str] = None
    cost: Optional[float] = Field(default=None, ge=0)
    status: Optional[BookingStatus] = None


class BookingOut(BookingBase):
    id: int
    status: BookingStatus
    checked_in_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None
    created_at: datetime

    customer: CustomerOut
    vehicle: VehicleOut

    class Config:
        from_attributes = True
