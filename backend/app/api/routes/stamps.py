from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_user_id
from app.repositories.stamp_repository import StampRepositoryError, list_stamps

router = APIRouter()


@router.get("/stamps")
def list_stamps_endpoint(user_id: str = Depends(get_user_id)):
    try:
        stamps = list_stamps(user_id)
    except StampRepositoryError as error:
        raise HTTPException(status_code=500, detail="Failed to list stamps") from error

    return [
        {
            "id": stamp["id"],
            "image_url": stamp["image_url"],
            "acquired_at": stamp["acquired_at"],
        }
        for stamp in stamps
    ]
