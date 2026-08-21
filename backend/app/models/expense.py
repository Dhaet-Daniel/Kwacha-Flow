import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("user_profiles.id"), index=True, nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("expense_categories.id"), index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="ZMW")
    description: Mapped[str | None] = mapped_column(Text)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    category: Mapped["ExpenseCategory"] = relationship(back_populates="expenses")

    @property
    def category_name(self) -> str | None:
        # Only safe when the category was eagerly loaded (selectinload)
        return self.category.name if self.category is not None else None
