from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///documents.db')
    
    # AWS settings
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_BUCKET_NAME: str
    AWS_REGION: str
    HUGGINGFACE_API_TOKEN: str

    def get_database_url(self) -> str:
        """Get the database URL, converting postgres:// to postgresql:// if needed"""
        url = self.DATABASE_URL
        if url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql://', 1)
        return url

    class Config:
        env_file = ".env"

# Validate AWS credentials are present
if not os.getenv('AWS_ACCESS_KEY_ID') or not os.getenv('AWS_SECRET_ACCESS_KEY') or not os.getenv('AWS_BUCKET_NAME'):
    raise ValueError("AWS credentials are missing. Please check your .env file.")

settings = Settings() 