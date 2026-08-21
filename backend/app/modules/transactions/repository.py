from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.income import Income


class IncomeRepository:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        start: date | None = None,
        end: date | None = None,
    ) -> tuple[list[Income], int]:
        base = select(Income).where(Income.user_id == user_id)
        if start:
            base = base.where(Income.date >= start)
        if end:
            base = base.where(Income.date <= end)

        total_result = await db.execute(select(sa_func.count()).select_from(base.subquery()))
        total = total_result.scalar_one()

        result = await db.execute(
            base.order_by(Income.date.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(db: AsyncSession, income_id: UUID, user_id: UUID) -> Income | None:
        result = await db.execute(
            select(Income).where(Income.id == income_id, Income.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, data: dict) -> Income:
        income = Income(user_id=user_id, **data)
        db.add(income)
        await db.commit()
        await db.refresh(income)
        return income

    @staticmethod
    async def update(db: AsyncSession, income: Income, data: dict) -> Income:
        for key, value in data.items():
            setattr(income, key, value)
        await db.commit()
        await db.refresh(income)
        return income

    @staticmethod
    async def delete(db: AsyncSession, income: Income) -> None:
        await db.delete(income)
        await db.commit()

    @staticmethod
    async def get_totals(
        db: AsyncSession, user_id: UUID, start: date | None = None, end: date | None = None
    ) -> Decimal:
        query = select(sa_func.coalesce(sa_func.sum(Income.amount), 0)).where(
            Income.user_id == user_id
        )
        if start:
            query = query.where(Income.date >= start)
        if end:
            query = query.where(Income.date <= end)
        result = await db.execute(query)
        return Decimal(str(result.scalar_one()))


class ExpenseCategoryRepository:
    @staticmethod
    async def get_all(db: AsyncSession):
        result = await db.execute(
            select(ExpenseCategory).order_by(ExpenseCategory.name)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, category_id: int) -> ExpenseCategory | None:
        result = await db.execute(
            select(ExpenseCategory).where(ExpenseCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_name(db: AsyncSession, name: str) -> ExpenseCategory | None:
        result = await db.execute(
            select(ExpenseCategory).where(ExpenseCategory.name == name)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: dict) -> ExpenseCategory:
        category = ExpenseCategory(**data)
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category


class ExpenseRepository:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        start: date | None = None,
        end: date | None = None,
        category_id: int | None = None,
    ) -> tuple[list[Expense], int]:
        base = select(Expense).where(Expense.user_id == user_id)
        if start:
            base = base.where(Expense.date >= start)
        if end:
            base = base.where(Expense.date <= end)
        if category_id:
            base = base.where(Expense.category_id == category_id)

        total_result = await db.execute(select(sa_func.count()).select_from(base.subquery()))
        total = total_result.scalar_one()

        result = await db.execute(
            base.options(selectinload(Expense.category))
            .order_by(Expense.date.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(db: AsyncSession, expense_id: UUID, user_id: UUID) -> Expense | None:
        result = await db.execute(
            select(Expense)
            .options(selectinload(Expense.category))
            .where(Expense.id == expense_id, Expense.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, data: dict) -> Expense:
        expense = Expense(user_id=user_id, **data)
        db.add(expense)
        await db.commit()
        await db.refresh(expense)
        await db.refresh(expense, ["category"])
        return expense

    @staticmethod
    async def update(db: AsyncSession, expense: Expense, data: dict) -> Expense:
        for key, value in data.items():
            setattr(expense, key, value)
        await db.commit()
        await db.refresh(expense)
        await db.refresh(expense, ["category"])
        return expense

    @staticmethod
    async def delete(db: AsyncSession, expense: Expense) -> None:
        await db.delete(expense)
        await db.commit()

    @staticmethod
    async def get_total(
        db: AsyncSession,
        user_id: UUID,
        start: date | None = None,
        end: date | None = None,
        category_id: int | None = None,
    ) -> Decimal:
        query = select(sa_func.coalesce(sa_func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id
        )
        if start:
            query = query.where(Expense.date >= start)
        if end:
            query = query.where(Expense.date <= end)
        if category_id:
            query = query.where(Expense.category_id == category_id)
        result = await db.execute(query)
        return Decimal(str(result.scalar_one()))
