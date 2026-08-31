import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("user_profiles.id"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    transactions: Mapped[list["SavingsTransaction"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )