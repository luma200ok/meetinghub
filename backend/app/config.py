import os

from dotenv import load_dotenv

# backend/.env 자동 로드 (없으면 OS 환경변수 사용)
load_dotenv()


class Config:
    SECRET_KEY: str = os.environ['SECRET_KEY']

    SUPABASE_URL: str     = os.environ['SUPABASE_URL']
    SUPABASE_SERVICE_KEY: str = os.environ['SUPABASE_SERVICE_KEY']

    OPENAI_API_KEY: str   = os.environ['OPENAI_API_KEY']

    CORS_ORIGINS: list[str] = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
