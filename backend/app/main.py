from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.modules.users import routes as user_routes

app = FastAPI(title="Student Finance API")

# CORS – allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional: create tables (if they don't exist)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(user_routes.router, prefix="/api/v1/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Student Finance API is running"}
