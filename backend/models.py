"""Database models for the Autonomous Support Resolution Agent."""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

Base = declarative_base()


class TicketStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    FAILED = "failed"


class TicketPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketCategory(enum.Enum):
    SOFTWARE = "software"
    HARDWARE = "hardware"
    NETWORK = "network"
    SECURITY = "security"
    ACCESS = "access"
    BILLING = "billing"
    GENERAL = "general"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True, nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    user_email = Column(String(100), nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.PENDING, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    category = Column(Enum(TicketCategory), nullable=True)
    assigned_team = Column(String(100), nullable=True)
    final_action = Column(String(100), nullable=True)   # "refund", "reply", "escalate"
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    reasoning_steps = relationship("ReasoningStep", back_populates="ticket", cascade="all, delete-orphan")
    tool_calls = relationship("ToolCall", back_populates="ticket", cascade="all, delete-orphan")


class ReasoningStep(Base):
    __tablename__ = "reasoning_steps"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    thought = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="reasoning_steps")


class ToolCall(Base):
    __tablename__ = "tool_calls"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    arguments = Column(JSON, nullable=True)
    result = Column(Text, nullable=True)
    status = Column(String(20), default="success")   # success | error | retried
    attempt = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="tool_calls")


def generate_ticket_id() -> str:
    import uuid
    return f"TKT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
