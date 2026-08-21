from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.income import Income
from app.modules.transactions.repository import (
    ExpenseCategoryRepository,
    ExpenseRepository,
    IncomeRepository,
)


class NotFoundError(Exception):
    pass


# ---------------- Income ----------------


async def list_incomes(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 50,
    offset: int = 0,
    start: date | None = None,
    end: date | None = None,
):
    return await IncomeRepository.get_all(db, user_id, limit, offset, start, end)


async def get_income(db: AsyncSession, user_id: UUID, income_id: UUID):
    return await IncomeRepository.get_by_id(db, income_id, user_id)


async def create_income(db: AsyncSession, user_id: UUID, data) -> Income:
    return await IncomeRepository.create(db, user_id, data.model_dump())


async def update_income(db: AsyncSession, user_id: UUID, income_id: UUID, data) -> Income:
    income = await IncomeRepository.get_by_id(db, income_id, user_id)
    if not income:
        raise NotFoundError("Income not found")
    return await IncomeRepository.update(db, income, data.model_dump(exclude_unset=True))


async def delete_income(db: AsyncSession, user_id: UUID, income_id: UUID) -> None:
    income = await IncomeRepository.get_by_id(db, income_id, user_id)
    if not income:
        raise NotFoundError("Income not found")
    await IncomeRepository.delete(db, income)


async def get_income_summary(db: AsyncSession, user_id: UUID, start: date | None = None, end: date | None = None) -> Decimal:
    return await IncomeRepository.get_totals(db, user_id, start, end)


# ---------------- Expense categories ----------------


async def list_categories(db: AsyncSession):
    return await ExpenseCategoryRepository.get_all(db)


async def create_category(db: AsyncSession, data) -> ExpenseCategory:
    existing = await ExpenseCategoryRepository.get_by_name(db, data.name)
    if existing:
        raise ValueError("Category already exists")
    return await ExpenseCategoryRepository.create(db, data.model_dump())


# ---------------- Expenses ----------------


async def list_expenses(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 50,
    offset: int = 0,
    start: date | None = None,
    end: date | None = None,
    category_id: int | None = None,
):
    return await ExpenseRepository.get_all(db, user_id, limit, offset, start, end, category_id)


async def get_expense(db: AsyncSession, user_id: UUID, expense_id: UUID):
    return await ExpenseRepository.get_by_id(db, expense_id, user_id)


async def create_expense(db: AsyncSession, user_id: UUID, data) -> Expense:
    payload = data.model_dump()
    if payload.get("category_id"):
        category = await ExpenseCategoryRepository.get_by_id(db, payload["category_id"], user_id)
        if not category:
            raise NotFoundError("Category not found")
    else:
        payload["category_id"] = None
    return await ExpenseRepository.create(db, user_id, payload)


async def update_expense(db: AsyncSession, user_id: UUID, expense_id: UUID, data) -> Expense:
    expense = await ExpenseRepository.get_by_id(db, expense_id, user_id)
    if not expense:
        raise NotFoundError("Expense not found")
    updates = data.model_dump(exclude_unset=True)
    if "category_id" in updates and updates["category_id"]:
        category = await ExpenseCategoryRepository.get_by_id(db, updates["category_id"], user_id)
        if not category:
            raise NotFoundError("Category not found")
    return await ExpenseRepository.update(db, expense, updates)


async def delete_expense(db: AsyncSession, user_id: UUID, expense_id: UUID) -> None:
    expense = await ExpenseRepository.get_by_id(db, expense_id, user_id)
    if not expense:
        raise NotFoundError("Expense not found")
    await ExpenseRepository.delete(db, expense)


async def get_expense_total(
    db: AsyncSession,
    user_id: UUID,
    start: date | None = None,
    end: date | None = None,
    category_id: UUID | None = None,
) -> Decimal:
    return await ExpenseRepository.get_total(db, user_id, start, end, category_id)


async def get_net_balance(
    db: AsyncSession,
    user_id: UUID,
    start: date | None = None,
    end: date | None = None,
) -> dict:
    total_income = await get_income_summary(db, user_id, start, end)
    total_expenses = await get_expense_total(db, user_id, start, end)
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net": total_income - total_expenses,
    }
