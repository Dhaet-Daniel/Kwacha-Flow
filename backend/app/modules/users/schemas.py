from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserProfileBase(BaseModel):
    full_name: str
    university: Optional[str] = None
    year_of_study: Optional[int] = None
    currency: str = "ZMW"
    preferences: Optional[dict] = {}


class UserProfileResponse(UserProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(UserProfileBase):
    pass
