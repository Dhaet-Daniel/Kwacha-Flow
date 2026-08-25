from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

VALID_PERIODS = {"monthly", "weekly", "semester"}


# ---------- Budget Category Allocation ----------


class BudgetCategoryAllocationBase(BaseModel):
    category_id: int
    allocated_amount: Decimal = Field(..., gt=0)


class BudgetCategoryAllocationCreate(BudgetCategoryAllocationBase):
    pass


class BudgetCategoryAllocationResponse(BaseModel):
    id: UUID
    budget_id: UUID
    category_id: int
    allocated_amount: Decimal

    class Config:
        from_attributes = True


# ---------- Budget ----------


class BudgetBase(BaseModel):
    name: str = Field(..., max_length=255)
    period: str  # monthly, weekly, semester
    start_date: date
    end_date: date
    total_budget: Optional[Decimal] = Field(None, gt=0)
    is_active: bool = True

    @field_validator("period")
    @classmethod
    def validate_period(cls, v):
        if v not in VALID_PERIODS:
            raise ValueError(f"period must be one of {VALID_PERIODS}")
        return v

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class BudgetCreate(BudgetBase):
    allocations: List[BudgetCategoryAllocationBase] = []

    @model_validator(mode="after")
    def validate_allocations(self):
        category_ids = [a.category_id for a in self.allocations]
        if len(category_ids) != len(set(category_ids)):
            raise ValueError("Duplicate category in allocations")
        return self


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    period: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[Decimal] = Field(None, gt=0)
    is_active: Optional[bool] = None

    @field_validator("period")
    @classmethod
    def validate_period(cls, v):
        if v is not None and v not in VALID_PERIODS:
            raise ValueError(f"period must be one of {VALID_PERIODS}")
        return v


class BudgetResponse(BudgetBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Budget Detail (with spending per category) ----------


class BudgetCategoryDetail(BaseModel):
    category_id: int
    category_name: str
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    allocated_amount: Decimal
    spent_amount: Decimal = Decimal("0")
    remaining: Decimal = Decimal("0")
    percentage_used: float = 0.0
    status: str  # 'ok', 'warning', 'exceeded'


class BudgetDetailResponse(BudgetResponse):
    allocations: List[BudgetCategoryDetail]
    total_spent: Decimal = Decimal("0")
    total_remaining: Decimal = Decimal("0")
    overall_percentage: float = 0.0
    days_remaining: Optional[int] = None
    daily_recommended_limit: Optional[Decimal] = None


# ---------- List ----------


class BudgetListResponse(BaseModel):
    data: List[BudgetResponse]
    total: int
