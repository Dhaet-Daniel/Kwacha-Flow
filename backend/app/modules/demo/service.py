from calendar import monthrange
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateError
from app.models.budget import Budget
from app.models.budget_category import BudgetCategory
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.income import Income
from app.models.savings_goal import SavingsGoal
from app.models.savings_transaction import SavingsTransaction

DEMO_DESCRIPTION = "Demo data (one-tap setup)"


async def _has_existing_data(db: AsyncSession, user_id: UUID) -> bool:
    for model in (Income, Expense, Budget, SavingsGoal):
        result = await db.execute(select(model.id).where(model.user_id == user_id).limit(1))
        if result.scalars().first():
            return True
    return False


async def seed_demo_data(db: AsyncSession, user_id: UUID) -> list:
    if await _has_existing_data(db, user_id):
        raise DuplicateError("You already have data. Clear it first, then seed demo data again.")

    today = date.today()
    month_start = today.replace(day=1)
    month_end = today.replace(day=monthrange(today.year, today.month)[1])

    cat_result = await db.execute(
        select(ExpenseCategory).where(ExpenseCategory.name.in_(
            ["Food", "Transport", "Data/Airtime", "Entertainment", "Education"]
        ))
    )
    cats = {c.name: c for c in cat_result.scalars().all()}

    db.add(Income(
        user_id=user_id,
        amount=Decimal("2000.00"),
        source="Allowance",
        date=today,
        description="Monthly allowance",
    ))

    expense_seed = [
        ("Food", "45.50", "Lunch at campus cafe"),
        ("Transport", "25.00", "Bus fare"),
        ("Data/Airtime", "30.00", "Mobile data bundle"),
    ]
    for name, amount, desc in expense_seed:
        cat = cats.get(name)
        if not cat:
            continue
        db.add(Expense(
            user_id=user_id,
            category_id=cat.id,
            amount=Decimal(amount),
            date=today,
            description=desc,
        ))

    budget = Budget(
        user_id=user_id,
        name="September 2026",
        period="monthly",
        start_date=month_start,
        end_date=month_end,
        total_budget=Decimal("1250.00"),
        is_active=True,
    )
    db.add(budget)
    await db.flush()

    alloc_seed = [
        ("Food", "500"),
        ("Transport", "300"),
        ("Data/Airtime", "150"),
        ("Entertainment", "200"),
        ("Education", "100"),
    ]
    for name, amount in alloc_seed:
        cat = cats.get(name)
        if not cat:
            continue
        db.add(BudgetCategory(
            budget_id=budget.id,
            category_id=cat.id,
            allocated_amount=Decimal(amount),
        ))

    goal = SavingsGoal(
        user_id=user_id,
        name="New Laptop",
        target_amount=Decimal("5000.00"),
        current_amount=Decimal("0"),
        target_date=date(2026, 12, 31),
        notes="Save for a new laptop",
    )
    db.add(goal)
    await db.flush()

    db.add(SavingsTransaction(
        user_id=user_id,
        goal_id=goal.id,
        amount=Decimal("200.00"),
        date=today,
        note="Demo contribution",
    ))
    goal.current_amount = Decimal("200.00")

    await db.commit()

    return [
        "1 income (K2000 Allowance)",
        "3 expenses (Food, Transport, Data/Airtime)",
        f"1 budget 'September 2026' ({month_start} → {month_end})",
        "1 savings goal 'New Laptop' with K200 saved",
    ]