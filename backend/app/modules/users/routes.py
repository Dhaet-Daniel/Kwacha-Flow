import mimetypes

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
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
    response = schemas.UserProfileResponse.model_validate(profile)
    response.avatar_url = service.avatar_url_for(user_id)
    return response


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


@router.put("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(..., description="Image file (JPG, PNG, GIF, WebP, max 5MB)"),
    user_id: str = Depends(get_current_user),
):
    content = await file.read()
    try:
        avatar_url = await service.save_avatar(user_id, content, file.content_type or "")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"avatar_url": avatar_url}


# Public on purpose: native <Image> elements cannot send the auth header when
# loading the avatar, so the file is fetched with a plain GET instead.
@router.get("/avatar/{user_id}")
async def get_avatar(user_id: str):
    path = service.avatar_path_for(user_id)
    if not path:
        raise HTTPException(status_code=404, detail="Avatar not found")
    media_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    return FileResponse(path, media_type=media_type)
