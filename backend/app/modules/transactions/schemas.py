from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

Amount = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=2),
]


# ---------- Income Schemas ----------


class IncomeBase(BaseModel):
    amount: Amount
    currency: str = "ZMW"
    source: str = Field(..., max_length=255)
    description: Optional[str] = None
    date: date
    is_recurring: bool = False
    recurrence_period: Optional[str] = None  # monthly, weekly, semester

    @field_validator("recurrence_period")
    @classmethod
    def validate_period(cls, v, info):
        if v is not None:
            allowed = {"monthly", "weekly", "semester"}
            if v not in allowed:
                raise ValueError(f"recurrence_period must be one of {allowed}")
        return v


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    amount: Optional[Amount] = None
    currency: Optional[str] = None
    source: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    date: Optional[date] = None
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = None


class IncomeResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    currency: str
    source: str
    description: Optional[str] = None
    date: date
    is_recurring: bool
    recurrence_period: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Expense Category Schemas ----------


class ExpenseCategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool = False


class ExpenseCategoryResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool

    class Config:
        from_attributes = True


# ---------- Expense Schemas ----------


class ExpenseBase(BaseModel):
    amount: Amount
    currency: str = "ZMW"
    category_id: int
    description: Optional[str] = None
    date: date


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[Amount] = None
    currency: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    date: Optional[date] = None


class ExpenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    currency: str
    category_id: int
    description: Optional[str] = None
    date: date
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- List Responses ----------


class IncomeListResponse(BaseModel):
    data: list[IncomeResponse]
    total: int
    limit: int
    offset: int


class ExpenseListResponse(BaseModel):
    data: list[ExpenseResponse]
    total: int
    limit: int
    offset: int
