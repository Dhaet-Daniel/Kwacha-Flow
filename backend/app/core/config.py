from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str
    database_url: str
    openai_api_key: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
