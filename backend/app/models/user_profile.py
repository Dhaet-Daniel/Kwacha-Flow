from sqlalchemy import JSON, Column, DateTime, Integer, String, Uuid, func

from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Uuid, primary_key=True)
    full_name = Column(String, nullable=False)
    university = Column(String, nullable=True)
    year_of_study = Column(Integer, nullable=True)
    currency = Column(String, default="ZMW")
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
