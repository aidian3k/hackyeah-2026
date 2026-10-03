"""Async silnik SQLAlchemy, fabryka sesji i helper do przekazywania wektorów.

Jedna `AsyncSession` nie obsługuje równoległych zapytań — kod z `asyncio.gather`
otwiera osobną sesję na każdy tor przez `SessionLocal()`.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from api.config import settings

engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Zależność FastAPI: jedna sesja na żądanie."""
    async with SessionLocal() as session:
        yield session


def to_pgvector(vec: list[float]) -> str:
    """Wektor jako literał pgvector do `CAST(:vec AS vector(1024))` w zapytaniach `text()`."""
    return "[" + ",".join(f"{x:.7f}" for x in vec) + "]"
