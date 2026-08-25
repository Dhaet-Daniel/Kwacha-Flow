from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.modules.budgets.repository import BudgetRepository, BudgetCategoryRepository
from app.modules.budgets.schemas import BudgetCreate, BudgetUpdate


def _spend_status(allocated: Decimal, spent: Decimal) -> str:
    if allocated <= 0:
        return "ok"
    pct = spent / allocated * 100
    if pct > 90:
        return "exceeded"
    if pct > 70:
        return "warning"
    return "ok"


def _build_detail(budget, cat_map: dict, spend_map: dict[int, Decimal], user_id: UUID, today: date) -> dict:
    days_remaining = max((budget.end_date - today).days, 0)
    alloc_map = {a.category_id: a for a in budget.allocations}

    total_spent = Decimal("0")
    total_allocated = Decimal("0")
    allocations = []
    for cat_id, alloc in alloc_map.items():
        spent = spend_map.get(cat_id, Decimal("0"))
        remaining = alloc.allocated_amount - spent
        total_spent += spent
        total_allocated += alloc.allocated_amount
        cat = cat_map.get(cat_id)
        pct = float(spent / alloc.allocated_amount * 100) if alloc.allocated_amount > 0 else 0.0
        allocations.append({
            "category_id": cat_id,
            "category_name": cat.name if cat else "Unknown",
            "category_icon": cat.icon if cat else None,
            "category_color": cat.color if cat else None,
            "allocated_amount": alloc.allocated_amount,
            "spent_amount": spent,
            "remaining": remaining,
            "percentage_used": round(pct, 1),
            "status": _spend_status(alloc.allocated_amount, spent),
        })

    overall_pct = float(total_spent / total_allocated * 100) if total_allocated > 0 else 0.0
    daily_limit = (total_allocated - total_spent) / days_remaining if days_remaining > 0 else None

    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "name": budget.name,
        "period": budget.period,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "total_budget": budget.total_budget,
        "is_active": budget.is_active,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
        "allocations": allocations,
        "total_spent": total_spent,
        "total_remaining": total_allocated - total_spent,
        "overall_percentage": round(overall_pct, 1),
        "days_remaining": days_remaining,
        "daily_recommended_limit": round(daily_limit, 2) if daily_limit else None,
    }


async def _load_category_map(db: AsyncSession) -> dict[int, ExpenseCategory]:
    cat_result = await db.execute(select(ExpenseCategory))
    return {c.id: c for c in cat_result.scalars().all()}


async def _load_spend_map(
    db: AsyncSession, user_id: UUID, start: date, end: date, category_ids: list[int]
) -> dict[int, Decimal]:
    if not category_ids:
        return {}
    stmt = (
        select(Expense.category_id, func.coalesce(func.sum(Expense.amount), 0).label("total"))
        .where(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
            Expense.category_id.in_(category_ids),
        )
        .group_by(Expense.category_id)
    )
    result = await db.execute(stmt)
    return {row.category_id: Decimal(str(row.total)) for row in result}


async def create_budget(db: AsyncSession, user_id: UUID, data: BudgetCreate) -> Budget:
    payload = data.model_dump(exclude={"allocations"})
    allocations = [
        {"category_id": a.category_id, "allocated_amount": a.allocated_amount}
        for a in data.allocations
    ]
    return await BudgetRepository.create(db, user_id, payload, allocations)


async def get_budget(db: AsyncSession, user_id: UUID, budget_id: UUID) -> dict:
    budget = await BudgetRepository.get_by_id(db, budget_id, user_id)
    if not budget:
        raise NotFoundError("Budget not found")
    cat_map = await _load_category_map(db)
    spend_map = await _load_spend_map(
        db, user_id, budget.start_date, budget.end_date,
        [a.category_id for a in budget.allocations],
    )
    return _build_detail(budget, cat_map, spend_map, user_id, date.today())


async def get_active_budget(db: AsyncSession, user_id: UUID) -> dict | None:
    budget = await BudgetRepository.get_active(db, user_id)
    if not budget:
        return None
    cat_map = await _load_category_map(db)
    spend_map = await _load_spend_map(
        db, user_id, budget.start_date, budget.end_date,
        [a.category_id for a in budget.allocations],
    )
    return _build_detail(budget, cat_map, spend_map, user_id, date.today())


async def list_budgets(db: AsyncSession, user_id: UUID) -> list:
    return await BudgetRepository.list_by_user(db, user_id)


async def update_budget(
    db: AsyncSession, user_id: UUID, budget_id: UUID, data: BudgetUpdate
) -> Budget:
    budget = await BudgetRepository.get_by_id(db, budget_id, user_id)
    if not budget:
        raise NotFoundError("Budget not found")
    updates = data.model_dump(exclude_unset=True)
    return await BudgetRepository.update(db, budget, updates)


async def update_allocations(
    db: AsyncSession, user_id: UUID, budget_id: UUID, allocations: list[dict]
) -> None:
    budget = await BudgetRepository.get_by_id(db, budget_id, user_id)
    if not budget:
        raise NotFoundError("Budget not found")
    await BudgetCategoryRepository.replace_all(db, budget_id, allocations)


async def delete_budget(db: AsyncSession, user_id: UUID, budget_id: UUID) -> None:
    budget = await BudgetRepository.get_by_id(db, budget_id, user_id)
    if not budget:
        raise NotFoundError("Budget not found")
    await BudgetRepository.delete(db, budget)
