from datetime import date, datetime
from decimal import Decimal
from typing import List
from uuid import UUID

from pydantic import BaseModel


class BudgetHealthItem(BaseModel):
    category_id: int
    category_name: str
    allocated: float
    spent: float
    remaining: float
    percentage: float
    status: str


class RecentTransactionItem(BaseModel):
    id: UUID
    type: str
    amount: float
    category: str
    description: str
    date: str


class InsightItem(BaseModel):
    id: UUID
    type: str
    message: str
    created_at: datetime


class DashboardResponse(BaseModel):
    balance: float
    total_income: float
    total_expenses: float
    savings_total: float
    budget_health: List[BudgetHealthItem]
    recent_transactions: List[RecentTransactionItem]
    insights: List[InsightItem]