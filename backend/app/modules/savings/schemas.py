from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------- Savings Goal ----------


class SavingsGoalBase(BaseModel):
    name: str = Field(..., max_length=255)
    target_amount: Decimal = Field(..., gt=0)
    target_date: date
    notes: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    target_amount: Optional[Decimal] = Field(None, gt=0)
    target_date: Optional[date] = None
    notes: Optional[str] = None


class SavingsGoalResponse(SavingsGoalBase):
    id: UUID
    user_id: UUID
    current_amount: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Savings Goal Detail (with computed progress) ----------


class SavingsGoalDetailResponse(SavingsGoalResponse):
    remaining: Decimal
    progress_percentage: float
    months_remaining: int
    required_monthly_saving: Decimal


# ---------- Savings Transaction ----------


class SavingsTransactionBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    date: date
    note: Optional[str] = None


class SavingsTransactionCreate(SavingsTransactionBase):
    pass


class SavingsTransactionResponse(SavingsTransactionBase):
    id: UUID
    goal_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- List Responses ----------


class SavingsGoalListResponse(BaseModel):
    data: List[SavingsGoalResponse]
    total: int


class SavingsTransactionListResponse(BaseModel):
    data: List[SavingsTransactionResponse]
    total: int