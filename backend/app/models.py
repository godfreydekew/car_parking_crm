import enum
from datetime import datetime
from sqlalchemy import (
    String,
    DateTime,
    Enum,
    Integer,
    Boolean,
    ForeignKey,
    Numeric,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


# ---------- Enums ----------
class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    driver = "driver"


class FlightType(str, enum.Enum):
    domestic = "domestic"
    international = "international"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    eft = "eft"
    card = "card"
    other = "other"


class BookingStatus(str, enum.Enum):
    booked = "BOOKED"
    on_site = "ON_SITE"
    collected = "COLLECTED"
    overstay = "OVERSTAY"
    cancelled = "CANCELLED"
    no_show = "NO_SHOW"


class LeadStatus(str, enum.Enum):
    new = "NEW"
    contacted = "CONTACTED"
    quoted = "QUOTED"
    booked = "BOOKED"
    lost = "LOST"


class AuditEventType(str, enum.Enum):
    created = "CREATED"
    check_in = "CHECK_IN"
    check_out = "CHECK_OUT"
    note = "NOTE"
    status_change = "STATUS_CHANGE"
    sync = "SYNC"


# ---------- Mixins ----------
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


# ---------- Models ----------
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.driver, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="actor")


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(40), index=True, nullable=True)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="customer", cascade="all, delete-orphan")

  
    __table_args__ = (
        Index("ix_customers_email_lower", "email"),
        Index("ix_customers_whatsapp", "whatsapp_number"),
    )


class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    registration: Mapped[str] = mapped_column(String(32), nullable=False)
    make_model: Mapped[str] = mapped_column(String(120), nullable=False)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="vehicle")

    __table_args__ = (
        UniqueConstraint("registration", name="uq_vehicle_registration"),
        Index("ix_vehicle_registration", "registration"),
    )


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Source tracking (since you sync from spreadsheet)
    source: Mapped[str] = mapped_column(String(30), default="spreadsheet", nullable=False)
    source_row_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)

    flight_type: Mapped[FlightType] = mapped_column(Enum(FlightType), nullable=False)
    dropoff_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    pickup_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), default=PaymentMethod.cash, nullable=False)
    special_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.booked, nullable=False)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    customer: Mapped["Customer"] = relationship(back_populates="bookings")
    vehicle: Mapped["Vehicle"] = relationship(back_populates="bookings")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="booking", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_booking_status", "status"),
        UniqueConstraint("source", "source_row_id", name="uq_booking_source_row"),
    )


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    whatsapp_number: Mapped[str | None] = mapped_column(String(40), index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    source: Mapped[str] = mapped_column(String(60), default="manual", nullable=False)
    status: Mapped[LeadStatus] = mapped_column(Enum(LeadStatus), default=LeadStatus.new, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), nullable=False, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    event_type: Mapped[AuditEventType] = mapped_column(Enum(AuditEventType), nullable=False)
    message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking: Mapped["Booking"] = relationship(back_populates="audit_logs")
    actor: Mapped["User"] = relationship(back_populates="audit_logs")
