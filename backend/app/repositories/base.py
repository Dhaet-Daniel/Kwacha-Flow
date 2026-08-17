from collections.abc import Sequence
from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, model: type[ModelT], id: Any) -> ModelT | None:
        return await self.db.get(model, id)

    async def list(self, model: type[ModelT]) -> Sequence[ModelT]:
        result = await self.db.execute(select(model))
        return result.scalars().all()

    async def add(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.db.delete(obj)
        await self.db.commit()
