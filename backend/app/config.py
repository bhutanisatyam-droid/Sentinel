from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_KEY: str = "mock-key" # Added for client lib compatibility
    SUPABASE_JWT_SECRET: str
    OPENSANCTIONS_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_API_KEY: str = ""
    GOOGLE_VISION_API_KEY: str = ""
    AZURE_VISION_API_KEY: str = ""
    AZURE_VISION_ENDPOINT: str = ""
    SETU_CLIENT_ID: str = ""
    SETU_CLIENT_SECRET: str = ""
    SETU_PRODUCT_INSTANCE_ID: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
