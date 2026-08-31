from datetime import date
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.budget_category import BudgetCategory
from app.models.expense_category import ExpenseCategory
from app.models.savings_goal import SavingsGoal

# NOTE: savings_goal and financial_insight tables do not exist yet in the
# database. They arrive in later tutorial steps; until then their aggregates
# return neutral defaults (0 / empty list) rather than erroring.


async def get_dashboard_data(db: AsyncSession, user_id: str) -> dict:
    today = date.today()
    month_start = today.replace(day=1)
    if today.month == 12:
        month_end = date(today.year + 1, 1, 1)
    else:
        month_end = date(today.year, today.month + 1, 1)

    # 1. Total income and expenses for the current month
    income_result = await db.execute(
        select(func.sum(Income.amount)).where(
            Income.user_id == user_id,
            Income.date >= month_start,
            Income.date < month_end,
        )
    )
    total_income = income_result.scalar() or Decimal(0)

    expense_result = await db.execute(
        select(func.sum(Expense.amount)).where(
            Expense.user_id == user_id,
            Expense.date >= month_start,
            Expense.date < month_end,
        )
    )
    total_expenses = expense_result.scalar() or Decimal(0)

    balance = total_income - total_expenses

    # 2. Savings total (sum of current amounts across the user's goals)
    savings_result = await db.execute(
        select(func.coalesce(func.sum(SavingsGoal.current_amount), 0)).where(
            SavingsGoal.user_id == user_id
        )
    )
    savings_total = savings_result.scalar() or Decimal(0)

    # 3. Budget health (active budget)
    budget_health: list[dict] = []
    budget_result = await db.execute(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.is_active == True,
            Budget.start_date <= today,
            Budget.end_date >= today,
        )
    )
    active_budget = budget_result.scalar_one_or_none()

    if active_budget:
        allocations_result = await db.execute(
            select(BudgetCategory).where(BudgetCategory.budget_id == active_budget.id)
        )
        allocations = allocations_result.scalars().all()
        alloc_map = {a.category_id: a for a in allocations}

        # Single batched category lookup instead of N+1
        cat_result = await db.execute(
            select(ExpenseCategory).where(ExpenseCategory.id.in_(list(alloc_map.keys())))
        )
        cat_map = {c.id: c for c in cat_result.scalars().all()}

        spend_map: dict[int, Decimal] = {}
        if alloc_map:
            spend_result = await db.execute(
                select(Expense.category_id, func.sum(Expense.amount))
                .where(
                    Expense.user_id == user_id,
                    Expense.category_id.in_(list(alloc_map.keys())),
                    Expense.date >= active_budget.start_date,
                    Expense.date <= active_budget.end_date,
                )
                .group_by(Expense.category_id)
            )
            spend_map = {category_id: spent or Decimal(0) for category_id, spent in spend_result}

        for category_id, alloc in alloc_map.items():
            spent = spend_map.get(category_id, Decimal(0))
            remaining = alloc.allocated_amount - spent
            percentage = (
                float(spent / alloc.allocated_amount * 100) if alloc.allocated_amount > 0 else 0
            )
            status = "ok" if percentage < 70 else ("warning" if percentage < 90 else "exceeded")
            cat = cat_map.get(category_id)
            budget_health.append({
                "category_id": category_id,
                "category_name": cat.name if cat else "Unknown",
                "allocated": float(alloc.allocated_amount),
                "spent": float(spent),
                "remaining": float(remaining),
                "percentage": percentage,
                "status": status,
            })

    # 4. Recent transactions (5 most recent, any type)
    recent = []

    expense_rows = await db.execute(
        select(Expense, ExpenseCategory.name)
        .join(ExpenseCategory, Expense.category_id == ExpenseCategory.id)
        .where(Expense.user_id == user_id)
        .order_by(Expense.date.desc(), Expense.created_at.desc())
        .limit(10)
    )
    for expense, cat_name in expense_rows:
        recent.append({
            "id": expense.id,
            "type": "expense",
            "amount": float(expense.amount),
            "category": cat_name or "Unknown",
            "description": expense.description or "",
            "date": expense.date.isoformat(),
        })

    income_rows = await db.execute(
        select(Income)
        .where(Income.user_id == user_id)
        .order_by(Income.date.desc(), Income.created_at.desc())
        .limit(10)
    )
    for inc in income_rows.scalars().all():
        recent.append({
            "id": inc.id,
            "type": "income",
            "amount": float(inc.amount),
            "category": inc.source,
            "description": inc.description or "",
            "date": inc.date.isoformat(),
        })

    recent.sort(key=lambda x: x["date"], reverse=True)
    recent = recent[:5]

    # 5. Insights (requires financial_insight table - not implemented yet)
    insights: list[dict] = []

    return {
        "balance": float(balance),
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "savings_total": float(savings_total),
        "budget_health": budget_health,
        "recent_transactions": recent,
        "insights": insights,
    }