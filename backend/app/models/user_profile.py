from sqlalchemy import JSON, Column, DateTime, Integer, String, func

from app.core.database import Base
import uuid


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    university = Column(String, nullable=True)
    year_of_study = Column(Integer, nullable=True)
    currency = Column(String, default="ZMW")
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
