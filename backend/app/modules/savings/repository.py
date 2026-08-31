from datetime import date
from typing import List, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.savings_goal import SavingsGoal
from app.models.savings_transaction import SavingsTransaction


class SavingsGoalRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, goal_id: UUID, user_id: UUID) -> SavingsGoal | None:
        result = await db.execute(
            select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_list(db: AsyncSession, user_id: UUID) -> Sequence[SavingsGoal]:
        result = await db.execute(
            select(SavingsGoal)
            .where(SavingsGoal.user_id == user_id)
            .order_by(SavingsGoal.target_date.asc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, data: dict) -> SavingsGoal:
        goal = SavingsGoal(user_id=user_id, **data)
        db.add(goal)
        await db.commit()
        await db.refresh(goal)
        return goal

    @staticmethod
    async def update(db: AsyncSession, goal: SavingsGoal, data: dict) -> SavingsGoal:
        for key, value in data.items():
            setattr(goal, key, value)
        await db.commit()
        await db.refresh(goal)
        return goal

    @staticmethod
    async def delete(db: AsyncSession, goal: SavingsGoal) -> None:
        await db.delete(goal)
        await db.commit()


class SavingsTransactionRepository:
    @staticmethod
    async def get_for_goal(db: AsyncSession, goal_id: UUID, user_id: UUID) -> Sequence[SavingsTransaction]:
        result = await db.execute(
            select(SavingsTransaction)
            .where(
                SavingsTransaction.goal_id == goal_id,
                SavingsTransaction.user_id == user_id,
            )
            .order_by(SavingsTransaction.date.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, goal_id: UUID, data: dict) -> SavingsTransaction:
        tx = SavingsTransaction(user_id=user_id, goal_id=goal_id, **data)
        db.add(tx)
        await db.commit()
        await db.refresh(tx)
        return tx

    @staticmethod
    async def delete(db: AsyncSession, tx: SavingsTransaction) -> None:
        await db.delete(tx)
        await db.commit()