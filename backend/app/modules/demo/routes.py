from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.demo import service

router = APIRouter(prefix="/demo", tags=["demo"])


class SeedResponse(BaseModel):
    detail: str
    summary: List[str] = []


@router.post("/seed", response_model=SeedResponse)
async def seed_demo(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    summary = await service.seed_demo_data(db, user_id)
    return SeedResponse(detail="Demo data created", summary=summary)