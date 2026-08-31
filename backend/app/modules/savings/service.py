from datetime import date
from decimal import Decimal
from typing import Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.savings_goal import SavingsGoal
from app.modules.savings.repository import SavingsGoalRepository, SavingsTransactionRepository
from app.modules.savings.schemas import (
    SavingsGoalCreate,
    SavingsGoalDetailResponse,
    SavingsGoalUpdate,
    SavingsTransactionCreate,
)


def _build_detail(goal: SavingsGoal) -> SavingsGoalDetailResponse:
    remaining = max(goal.target_amount - goal.current_amount, Decimal("0"))
    progress = (
        float(goal.current_amount / goal.target_amount * 100)
        if goal.target_amount > 0
        else 0.0
    )

    today = date.today()
    months_remaining = (
        (goal.target_date.year - today.year) * 12
        + (goal.target_date.month - today.month)
    )
    if goal.target_date.day < today.day:
        months_remaining -= 1
    months_remaining = max(months_remaining, 0)

    required_monthly = (
        remaining / months_remaining if months_remaining > 0 and remaining > 0 else Decimal("0")
    )

    return SavingsGoalDetailResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        notes=goal.notes,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        remaining=remaining,
        progress_percentage=round(progress, 1),
        months_remaining=months_remaining,
        required_monthly_saving=round(required_monthly, 2),
    )


async def get_goal_list(db: AsyncSession, user_id: UUID) -> tuple[Sequence[SavingsGoal], int]:
    items = await SavingsGoalRepository.get_list(db, user_id)
    return items, len(items)


async def get_goal(db: AsyncSession, user_id: UUID, goal_id: UUID) -> SavingsGoal:
    goal = await SavingsGoalRepository.get_by_id(db, goal_id, user_id)
    if not goal:
        raise NotFoundError("Goal not found")
    return goal


async def get_goal_detail(db: AsyncSession, user_id: UUID, goal_id: UUID) -> SavingsGoalDetailResponse:
    goal = await SavingsGoalRepository.get_by_id(db, goal_id, user_id)
    if not goal:
        raise NotFoundError("Goal not found")
    return _build_detail(goal)


async def create_goal(db: AsyncSession, user_id: UUID, data: SavingsGoalCreate) -> SavingsGoal:
    return await SavingsGoalRepository.create(db, user_id, data.model_dump())


async def update_goal(
    db: AsyncSession, user_id: UUID, goal_id: UUID, data: SavingsGoalUpdate
) -> SavingsGoal:
    goal = await SavingsGoalRepository.get_by_id(db, goal_id, user_id)
    if not goal:
        raise NotFoundError("Goal not found")
    updates = data.model_dump(exclude_unset=True)
    return await SavingsGoalRepository.update(db, goal, updates)


async def delete_goal(db: AsyncSession, user_id: UUID, goal_id: UUID) -> None:
    goal = await SavingsGoalRepository.get_by_id(db, goal_id, user_id)
    if not goal:
        raise NotFoundError("Goal not found")
    await SavingsGoalRepository.delete(db, goal)


async def add_contribution(
    db: AsyncSession, user_id: UUID, goal_id: UUID, data: SavingsTransactionCreate
):
    goal = await SavingsGoalRepository.get_by_id(db, goal_id, user_id)
    if not goal:
        raise NotFoundError("Goal not found")

    tx = await SavingsTransactionRepository.create(db, user_id, goal_id, data.model_dump())
    goal.current_amount += data.amount
    await db.commit()
    await db.refresh(goal)
    return tx, goal


async def get_contributions(db: AsyncSession, user_id: UUID, goal_id: UUID) -> Sequence:
    await get_goal(db, user_id, goal_id)
    return await SavingsTransactionRepository.get_for_goal(db, goal_id, user_id)