from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.modules.users import routes as user_routes
from app.modules.transactions import routes as transaction_routes

app = FastAPI(title="Student Finance API")

# CORS – allow all origins during development

# Optional: create tables (if they don't exist)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(user_routes.router, prefix="/api/v1/users", tags=["users"])
app.include_router(transaction_routes.router, prefix="/api/v1/transactions", tags=["transactions"])

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
