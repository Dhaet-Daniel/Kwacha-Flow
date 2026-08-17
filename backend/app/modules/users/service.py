from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserProfileUpdate, UserProfileResponse


async def get_profile(db, user_id: str):
    profile = await UserRepository.get_by_id(db, user_id)
    if not profile:
        return None
    return profile   # ORM object, will be converted by Pydantic


async def create_profile(db, user_id: str, data: dict):
    # check if exists first
    existing = await UserRepository.get_by_id(db, user_id)
    if existing:
        raise ValueError("Profile already exists")
    return await UserRepository.create(db, user_id, data)


async def update_profile(db, user_id: str, data: UserProfileUpdate):
    profile = await UserRepository.get_by_id(db, user_id)
    if not profile:
        raise ValueError("Profile not found")
    updated = await UserRepository.update(db, profile, data.dict(exclude_unset=True))
    return updated
