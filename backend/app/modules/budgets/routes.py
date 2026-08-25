from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.budgets.schemas import (
    BudgetCreate,
    BudgetUpdate,
    BudgetCategoryAllocationBase,
    BudgetResponse,
    BudgetDetailResponse,
    BudgetListResponse,
)
from app.modules.budgets import service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=BudgetListResponse)
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    budgets = await service.list_budgets(db, user["id"])
    return BudgetListResponse(data=budgets, total=len(budgets))


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(
    data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await service.create_budget(db, user["id"], data)


@router.get("/active", response_model=BudgetDetailResponse)
async def get_active_budget(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    result = await service.get_active_budget(db, user["id"])
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No active budget found")
    return result


@router.get("/{budget_id}", response_model=BudgetDetailResponse)
async def get_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await service.get_budget(db, user["id"], budget_id)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: UUID,
    data: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await service.update_budget(db, user["id"], budget_id, data)


@router.put("/{budget_id}/allocations")
async def update_allocations(
    budget_id: UUID,
    allocations: List[BudgetCategoryAllocationBase],
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    await service.update_allocations(
        db, user["id"], budget_id,
        [a.model_dump() for a in allocations],
    )
    return {"detail": "Allocations updated"}


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    await service.delete_budget(db, user["id"], budget_id)
