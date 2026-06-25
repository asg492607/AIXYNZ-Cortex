import os
from pydantic import BaseModel

class Settings(BaseModel):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")

settings = Settings()
