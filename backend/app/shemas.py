from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal, List


BookingStatus = Literal["BOOKED", "ON_SITE", "COLLECTED", "OVERSTAY", "CANCELLED", "NO_SHOW"]
FlightType = Literal["domestic", "international"]
PaymentMethod = Literal["cash", "eft", "card", "other"]

# ---------- Users ----------
class UserBase(BaseModel):
    """Shared user properties"""
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr = Field(min_length=2, max_length=255)


class UserCreate(UserBase):
    """For user registration - accepts plain password"""
    password: str = Field(min_length=8, max_length=100)


class UserInDB(UserBase):
    id: int
    password_hash: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    
class ChatResponse(BaseModel):
    answer: str
    sql_used: str
    row_count: int