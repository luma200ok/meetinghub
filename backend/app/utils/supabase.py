from functools import lru_cache
from supabase import create_client, Client
from flask import current_app


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    return create_client(
        current_app.config['SUPABASE_URL'],
        current_app.config['SUPABASE_SERVICE_KEY'],
    )
