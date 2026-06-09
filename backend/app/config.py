import os

from dotenv import load_dotenv

# backend/.env 자동 로드 (없으면 OS 환경변수 사용)
load_dotenv()


class Config:
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'default-flask-secret-key')

    SUPABASE_URL: str     = os.environ.get('SUPABASE_URL', 'https://placeholder-project.supabase.co')
    SUPABASE_SERVICE_KEY: str = os.environ.get('SUPABASE_SERVICE_KEY', 'placeholder-service-key')

    OPENAI_API_KEY: str   = os.environ.get('OPENAI_API_KEY', '')

    CORS_ORIGINS: list[str] = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')

