import os

from dotenv import load_dotenv

# backend/.env 자동 로드 (없으면 OS 환경변수 사용)
load_dotenv()


class Config:
    SECRET_KEY: str = os.environ['SECRET_KEY']

    SUPABASE_URL: str     = os.environ['SUPABASE_URL']
    SUPABASE_SERVICE_KEY: str = os.environ['SUPABASE_SERVICE_KEY']

    OPENAI_API_KEY: str   = os.environ['OPENAI_API_KEY']

    # 콤마 구분. 항목별 공백/끝 슬래시 제거 — 'a, b/' 같은 오타로 CORS 가 조용히 깨지는 것 방지.
    # (브라우저 Origin 헤더는 끝 슬래시가 없으므로 'https://x/' 로 넣어도 매칭되도록 정규화)
    CORS_ORIGINS: list[str] = [
        o.strip().rstrip('/')
        for o in os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
        if o.strip()
    ]
