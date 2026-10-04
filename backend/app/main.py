import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.core.exceptions import register_exception_handlers
from app.modules.users import routes as user_routes
from app.modules.transactions import routes as transaction_routes
from app.modules.budgets import routes as budget_routes
from app.modules.dashboard import routes as dashboard_routes
from app.modules.savings import routes as savings_routes
from app.modules.demo import routes as demo_routes

app = FastAPI(title="Student Finance API")

register_exception_handlers(app)

logger = logging.getLogger("uvicorn.error")

# CORS – allow all origins during development

# Optional: create tables (if they don't exist).
# Retried because Supabase's Supavisor pooler can intermittently fail
# with "tenant not found" when a tenant mapping cold-starts; a fresh
# server boot must not die on a single flap.
@app.on_event("startup")
async def startup():
    last_error: Exception | None = None
    delays = [2, 2, 3, 3, 4, 5, 6, 8]
    for attempt, delay in enumerate(delays, start=1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            return
        except Exception as exc:  # noqa: BLE001 - surface the last failure after retries
            last_error = exc
            logger.warning("Database connect failed (attempt %d/%d): %s", attempt, len(delays), exc)
            await asyncio.sleep(delay)
    if last_error:
        raise last_error

app.include_router(user_routes.router, prefix="/api/v1/users", tags=["users"])
app.include_router(transaction_routes.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(budget_routes.router, prefix="/api/v1", tags=["budgets"])
app.include_router(dashboard_routes.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(savings_routes.router, prefix="/api/v1", tags=["savings"])
app.include_router(demo_routes.router, prefix="/api/v1", tags=["demo"])

@app.get("/")
async def root():
    return {"message": "Student Finance API is running"}


# Wrap the entire application so CORS headers are also present on error
# responses generated outside FastAPI's normal route handling.
app = CORSMiddleware(
    app=app,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
