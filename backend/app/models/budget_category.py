import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BudgetCategory(Base):
    __tablename__ = "budget_categories"
    __table_args__ = (UniqueConstraint("budget_id", "category_id", name="uq_budget_category"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    budget_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[int] = mapped_column(ForeignKey("expense_categories.id"), nullable=False)
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    budget: Mapped["Budget"] = relationship(back_populates="allocations")
