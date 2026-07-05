import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.core.auth import get_user_id
from app.repositories.stamp_repository import (
    StampRepositoryError,
    delete_stamp,
    delete_stamp_image_by_url,
    get_stamp,
    list_stamps,
    update_stamp_details,
)

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


class StampUpdateRequest(BaseModel):
    memo: str | None = None
    spot_name: str | None = None
    acquired_at: str | None = None


def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def normalize_required_datetime(value: str | None) -> str:
    if value is None:
        raise HTTPException(status_code=400, detail="Invalid acquired_at")
    value = value.strip()
    if not value:
        raise HTTPException(status_code=400, detail="Invalid acquired_at")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid acquired_at") from error
    return value


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
            "memo": stamp.get("memo"),
            "tilt_angle": stamp.get("tilt_angle"),
            "scratch_level": stamp.get("scratch_level"),
            "color": stamp.get("color"),
            "frame": stamp.get("frame"),
        }
        for stamp in stamps
    ]


@router.patch("/stamps/{stamp_id}")
def update_stamp_endpoint(
    stamp_id: str,
    payload: StampUpdateRequest,
    user_id: str = Depends(get_user_id),
):
    updates: dict = {}
    if "memo" in payload.model_fields_set:
        updates["memo"] = normalize_optional_text(payload.memo)
    if "spot_name" in payload.model_fields_set:
        updates["spot_name"] = normalize_optional_text(payload.spot_name)
    if "acquired_at" in payload.model_fields_set:
        updates["acquired_at"] = normalize_required_datetime(payload.acquired_at)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        updated = update_stamp_details(stamp_id, user_id=user_id, updates=updates)
    except StampRepositoryError as error:
        logger.exception("stamp update failed stamp_id=%s", stamp_id)
        raise HTTPException(status_code=500, detail="Failed to update stamp") from error

    if updated is None:
        raise HTTPException(status_code=404, detail="Stamp not found")

    return {
        "id": updated["id"],
        "memo": updated.get("memo"),
        "spot_name": updated.get("spot_name"),
        "acquired_at": updated.get("acquired_at"),
    }


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
