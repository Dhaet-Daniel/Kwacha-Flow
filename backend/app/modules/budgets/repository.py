from datetime import date
from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.budget import Budget
from app.models.budget_category import BudgetCategory


class BudgetRepository:
    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, payload: dict, allocations: list[dict] | None = None) -> Budget:
        budget = Budget(user_id=user_id, **payload)
        db.add(budget)
        await db.flush()
        for alloc in (allocations or []):
            db.add(BudgetCategory(budget_id=budget.id, **alloc))
        await db.commit()
        await db.refresh(budget)
        return budget

    @staticmethod
    async def get_by_id(db: AsyncSession, budget_id: UUID, user_id: UUID) -> Budget | None:
        result = await db.execute(
            select(Budget)
            .options(selectinload(Budget.allocations))
            .where(Budget.id == budget_id, Budget.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_active(db: AsyncSession, user_id: UUID) -> Budget | None:
        today = date.today()
        result = await db.execute(
            select(Budget)
            .options(selectinload(Budget.allocations))
            .where(
                Budget.user_id == user_id,
                Budget.is_active == True,
                Budget.start_date <= today,
                Budget.end_date >= today,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(db: AsyncSession, user_id: UUID) -> Sequence[Budget]:
        result = await db.execute(
            select(Budget)
            .options(selectinload(Budget.allocations))
            .where(Budget.user_id == user_id)
            .order_by(Budget.is_active.desc(), Budget.start_date.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update(db: AsyncSession, budget: Budget, updates: dict) -> Budget:
        for k, v in updates.items():
            setattr(budget, k, v)
        await db.commit()
        await db.refresh(budget)
        return budget

    @staticmethod
    async def delete(db: AsyncSession, budget: Budget) -> None:
        await db.delete(budget)
        await db.commit()


class BudgetCategoryRepository:
    @staticmethod
    async def replace_all(db: AsyncSession, budget_id: UUID, allocations: list[dict]) -> list[BudgetCategory]:
        await db.execute(
            BudgetCategory.__table__.delete().where(BudgetCategory.budget_id == budget_id)
        )
        items = []
        for alloc in allocations:
            bcat = BudgetCategory(budget_id=budget_id, **alloc)
            db.add(bcat)
            items.append(bcat)
        await db.commit()
        for bcat in items:
            await db.refresh(bcat)
        return items

    @staticmethod
    async def get_for_budget(db: AsyncSession, budget_id: UUID) -> Sequence[BudgetCategory]:
        result = await db.execute(
            select(BudgetCategory).where(BudgetCategory.budget_id == budget_id)
        )
        return result.scalars().all()
