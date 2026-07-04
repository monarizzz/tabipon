import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

    if not supabase_url:
        raise RuntimeError("SUPABASE_URL is not set")
    if not service_key:
        raise RuntimeError("SUPABASE_SERVICE_KEY is not set")

    return create_client(supabase_url, service_key)
