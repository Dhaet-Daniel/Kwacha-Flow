from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user_profile import UserProfile


class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str):
        result = await db.execute(select(UserProfile).where(UserProfile.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, user_id: str, data: dict):
        profile = UserProfile(id=user_id, **data)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def update(db: AsyncSession, profile: UserProfile, data: dict):
        for key, value in data.items():
            setattr(profile, key, value)
        await db.commit()
        await db.refresh(profile)
        return profile
