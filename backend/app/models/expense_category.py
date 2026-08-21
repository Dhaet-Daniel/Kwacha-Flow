from sqlalchemy import Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(Text)
    # true = predefined category shared by all users
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

    expenses: Mapped[list["Expense"]] = relationship(back_populates="category")
