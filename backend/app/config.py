import os


class Config:
    SECRET_KEY: str = os.environ['SECRET_KEY']

    SUPABASE_URL: str     = os.environ['SUPABASE_URL']
    SUPABASE_SERVICE_KEY: str = os.environ['SUPABASE_SERVICE_KEY']

    OPENAI_API_KEY: str   = os.environ['OPENAI_API_KEY']

    CORS_ORIGINS: list[str] = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
