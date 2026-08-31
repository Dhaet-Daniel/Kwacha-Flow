from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.savings import service
from app.modules.savings.schemas import (
    SavingsGoalCreate,
    SavingsGoalDetailResponse,
    SavingsGoalListResponse,
    SavingsGoalResponse,
    SavingsGoalUpdate,
    SavingsTransactionCreate,
    SavingsTransactionListResponse,
    SavingsTransactionResponse,
)

router = APIRouter(prefix="/savings", tags=["savings"])


@router.get("/goals", response_model=SavingsGoalListResponse)
async def list_goals(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    items, total = await service.get_goal_list(db, user_id)
    return SavingsGoalListResponse(data=items, total=total)


@router.post("/goals", response_model=SavingsGoalResponse, status_code=201)
async def create_goal(
    data: SavingsGoalCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return await service.create_goal(db, user_id, data)


@router.get("/goals/{goal_id}", response_model=SavingsGoalDetailResponse)
async def get_goal_detail(
    goal_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return await service.get_goal_detail(db, user_id, goal_id)


@router.put("/goals/{goal_id}", response_model=SavingsGoalResponse)
async def update_goal(
    goal_id: UUID,
    data: SavingsGoalUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return await service.update_goal(db, user_id, goal_id, data)


@router.delete("/goals/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await service.delete_goal(db, user_id, goal_id)


@router.post("/goals/{goal_id}/contributions", response_model=SavingsTransactionResponse, status_code=201)
async def add_contribution(
    goal_id: UUID,
    data: SavingsTransactionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    tx, _ = await service.add_contribution(db, user_id, goal_id, data)
    return tx


@router.get("/goals/{goal_id}/contributions", response_model=SavingsTransactionListResponse)
async def list_contributions(
    goal_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    items = await service.get_contributions(db, user_id, goal_id)
    return SavingsTransactionListResponse(data=items, total=len(items))