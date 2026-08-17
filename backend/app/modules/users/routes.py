from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.users import service, schemas

router = APIRouter()


@router.get("/profile", response_model=schemas.UserProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await service.get_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/profile", response_model=schemas.UserProfileResponse, status_code=201)
async def create_profile(
    data: schemas.UserProfileBase,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        new_profile = await service.create_profile(db, user_id, data.dict())
        return new_profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/profile", response_model=schemas.UserProfileResponse)
async def update_profile(
    data: schemas.UserProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        updated = await service.update_profile(db, user_id, data)
        return updated
    except ValueError:
        raise HTTPException(status_code=404, detail="Profile not found")
