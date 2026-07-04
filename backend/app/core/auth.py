import os

from fastapi import Header, HTTPException
from jose import JWTError, jwt


def get_user_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
        return payload["sub"]
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
