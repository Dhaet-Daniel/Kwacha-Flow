from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserProfileBase(BaseModel):
    full_name: str
    university: Optional[str] = None
    year_of_study: Optional[int] = None
    currency: str = "ZMW"
    preferences: Optional[dict] = {}


class UserProfileResponse(UserProfileBase):
    # SQLAlchemy returns this primary key as a UUID instance. FastAPI serializes
    # UUID values to strings in the JSON sent to the mobile client.
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(UserProfileBase):
    pass
