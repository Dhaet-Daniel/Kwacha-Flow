from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.transactions import schemas, service

router = APIRouter()


# ---------------- Income ----------------


@router.get("/incomes", response_model=schemas.IncomeListResponse)
async def list_incomes(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    start: Optional[date] = Query(None, description="Filter from date (inclusive)"),
    end: Optional[date] = Query(None, description="Filter to date (inclusive)"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await service.list_incomes(db, user_id, limit, offset, start, end)
    return schemas.IncomeListResponse(data=items, total=total, limit=limit, offset=offset)


@router.post("/incomes", response_model=schemas.IncomeResponse, status_code=201)
async def create_income(
    data: schemas.IncomeCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.create_income(db, user_id, data)


@router.get("/incomes/{income_id}", response_model=schemas.IncomeResponse)
async def get_income(
    income_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    income = await service.get_income(db, user_id, income_id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income


@router.put("/incomes/{income_id}", response_model=schemas.IncomeResponse)
async def update_income(
    income_id: UUID,
    data: schemas.IncomeUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.update_income(db, user_id, income_id, data)
    except service.NotFoundError:
        raise HTTPException(status_code=404, detail="Income not found")


@router.delete("/incomes/{income_id}", status_code=204)
async def delete_income(
    income_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.delete_income(db, user_id, income_id)
    except service.NotFoundError:
        raise HTTPException(status_code=404, detail="Income not found")


# ---------------- Expense categories ----------------


@router.get("/categories", response_model=list[schemas.ExpenseCategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    return await service.list_categories(db)


@router.post("/categories", response_model=schemas.ExpenseCategoryResponse, status_code=201)
async def create_category(
    data: schemas.ExpenseCategoryCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.create_category(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------- Expenses ----------------


@router.get("/expenses", response_model=schemas.ExpenseListResponse)
async def list_expenses(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    start: Optional[date] = Query(None, description="Filter from date (inclusive)"),
    end: Optional[date] = Query(None, description="Filter to date (inclusive)"),
    category_id: Optional[int] = Query(None),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await service.list_expenses(db, user_id, limit, offset, start, end, category_id)
    return schemas.ExpenseListResponse(data=items, total=total, limit=limit, offset=offset)


@router.post("/expenses", response_model=schemas.ExpenseResponse, status_code=201)
async def create_expense(
    data: schemas.ExpenseCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.create_expense(db, user_id, data)
    except service.NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
async def get_expense(
    expense_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await service.get_expense(db, user_id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
async def update_expense(
    expense_id: UUID,
    data: schemas.ExpenseUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.update_expense(db, user_id, expense_id, data)
    except service.NotFoundError as e:
        message = str(e)
        status = 400 if "Category" in message else 404
        raise HTTPException(status_code=status, detail=message)


@router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.delete_expense(db, user_id, expense_id)
    except service.NotFoundError:
        raise HTTPException(status_code=404, detail="Expense not found")


# ---------------- Summary ----------------


@router.get("/summary")
async def get_summary(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Decimal]:
    return await service.get_net_balance(db, user_id, start, end)
