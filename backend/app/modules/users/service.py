from pathlib import Path

from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserProfileUpdate, UserProfileResponse

# Uploaded avatars live on local disk under backend/uploads/avatars. Files are
# keyed by user id, so re-uploading simply replaces the previous file and no
# database column or migration is needed.
AVATAR_DIR = Path(__file__).resolve().parents[3] / "uploads" / "avatars"
AVATAR_MAX_BYTES = 5 * 1024 * 1024
EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


async def save_avatar(user_id: str, content: bytes, content_type: str) -> str:
    ext = EXTENSIONS.get(content_type or "")
    if ext is None:
        raise ValueError("Only JPG, PNG, GIF or WebP images are allowed")
    if len(content) > AVATAR_MAX_BYTES:
        raise ValueError("Image must be 5MB or smaller")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    for old in AVATAR_DIR.glob(f"{user_id}.*"):
        old.unlink(missing_ok=True)
    (AVATAR_DIR / f"{user_id}{ext}").write_bytes(content)
    return f"/api/v1/users/avatar/{user_id}"


def avatar_url_for(user_id: str) -> str | None:
    return f"/api/v1/users/avatar/{user_id}" if avatar_path_for(user_id) else None


def avatar_path_for(user_id: str) -> Path | None:
    return next(iter(AVATAR_DIR.glob(f"{user_id}.*")), None)


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
