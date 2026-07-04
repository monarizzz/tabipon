import logging

from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.auth import get_user_id
from app.repositories.stamp_repository import (
    StampRepositoryError,
    delete_stamp,
    delete_stamp_image_by_url,
    get_stamp,
    list_stamps,
)

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


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
            "latitude": stamp.get("latitude"),
            "longitude": stamp.get("longitude"),
            "spot_name": stamp.get("spot_name"),
            "tilt_angle": stamp.get("tilt_angle"),
        }
        for stamp in stamps
    ]


@router.delete("/stamps/{stamp_id}", status_code=204)
def delete_stamp_endpoint(stamp_id: str):  # stamps.id は uuid
    logger.info("stamp delete received stamp_id=%s", stamp_id)

    try:
        stamp = get_stamp(stamp_id)
    except StampRepositoryError as error:
        logger.exception("stamp delete find failed stamp_id=%s", stamp_id)
        raise HTTPException(status_code=500, detail="Failed to get stamp") from error

    if stamp is None:
        logger.warning("stamp delete not found stamp_id=%s", stamp_id)
        raise HTTPException(status_code=404, detail="Stamp not found")

    try:
        delete_stamp(stamp_id)
    except StampRepositoryError as error:
        logger.exception("stamp delete failed stamp_id=%s", stamp_id)
        raise HTTPException(status_code=500, detail="Failed to delete stamp") from error

    # DBレコード削除後にストレージ画像を後始末する(失敗しても握りつぶす)
    delete_stamp_image_by_url(stamp["image_url"])
    logger.info("stamp delete completed stamp_id=%s", stamp_id)

    return Response(status_code=204)
