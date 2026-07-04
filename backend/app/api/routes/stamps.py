from fastapi import APIRouter, HTTPException

from app.repositories.stamp_repository import StampRepositoryError, list_stamps

router = APIRouter()


@router.get("/stamps")
def list_stamps_endpoint():
    try:
        stamps = list_stamps()
    except StampRepositoryError as error:
        raise HTTPException(status_code=500, detail="Failed to list stamps") from error

    return [
        {
            "id": stamp["id"],
            "image_url": stamp["image_url"],
            "acquired_at": stamp["acquired_at"],
            "latitude": stamp.get("latitude"),
            "longitude": stamp.get("longitude"),
            "spot_name": stamp.get("spot_name"),
            "tilt_angle": stamp.get("tilt_angle"),
        }
        for stamp in stamps
    ]
