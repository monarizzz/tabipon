import base64
import logging
from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.auth import get_user_id
from app.core.config import ALLOWED_CONTENT_TYPES, MAX_IMAGE_BYTES
from app.repositories.stamp_repository import (
    StampRepositoryError,
    create_stamp,
    delete_stamp_image_by_url,
    get_stamp,
    update_stamp_image_url,
    upload_stamp_image,
)
from app.services.stamp_processor import StampColor, StampFrame, decode_image, process_stamp_image

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


@router.post("/stamp-image")
async def create_stamp_image_endpoint(
    image: Annotated[UploadFile, File()],
    color: StampColor = Form(StampColor.red),
    frame: StampFrame = Form(StampFrame.classic),
    scratch_level: float = Form(0.0),
    # 位置情報は multipart フォームで送られるため Form() で受ける
    latitude: Annotated[float | None, Form()] = None,
    longitude: Annotated[float | None, Form()] = None,
    spot_name: Annotated[str | None, Form()] = None,
    tilt_angle: Annotated[float | None, Form()] = None,
    user_id: str = Depends(get_user_id),
):
    logger.info(
        "stamp-image create received filename=%s content_type=%s color=%s scratch_level=%s lat=%s lng=%s user_id=%s",
        image.filename,
        image.content_type,
        color,
        scratch_level,
        latitude,
        longitude,
        user_id,
    )
    image_bytes = await image.read()
    logger.info("stamp-image create read bytes=%s", len(image_bytes))
    validate_upload(image, image_bytes)
    validate_image_data(image_bytes)

    png_bytes = process_stamp_image(image_bytes, color, frame, scratch_level)
    logger.info("stamp-image create processed png_bytes=%s", len(png_bytes))
    stamp = save_stamp(
        png_bytes,
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        spot_name=spot_name,
        tilt_angle=tilt_angle,
    )
    logger.info("stamp-image create saved stamp_id=%s", stamp.get("id"))

    return {
        "id": stamp["id"],
        "image_url": stamp["image_url"],
    }


@router.post("/stamp-image/preview")
async def preview_stamp_image_endpoint(
    image: Annotated[UploadFile, File()],
    color: StampColor = Form(StampColor.red),
    frame: StampFrame = Form(StampFrame.classic),
    scratch_level: float = Form(0.0),
):
    image_bytes = await image.read()
    validate_upload(image, image_bytes)
    validate_image_data(image_bytes)
    png_bytes = process_stamp_image(image_bytes, color, frame, scratch_level)
    return {"image_base64": base64.b64encode(png_bytes).decode()}


@router.put("/stamp-image/{stamp_id}")
async def update_stamp_image_endpoint(
    stamp_id: str,  # stamps.id は uuid
    image: Annotated[UploadFile, File()],
    color: StampColor = Form(StampColor.red),
    frame: StampFrame = Form(StampFrame.classic),
    scratch_level: float = Form(0.0),
):
    logger.info(
        "stamp-image update received stamp_id=%s filename=%s content_type=%s color=%s scratch_level=%s",
        stamp_id,
        image.filename,
        image.content_type,
        color,
        scratch_level,
    )
    image_bytes = await image.read()
    logger.info("stamp-image update read bytes=%s stamp_id=%s", len(image_bytes), stamp_id)
    validate_upload(image, image_bytes)
    validate_image_data(image_bytes)

    stamp = find_stamp(stamp_id)

    png_bytes = process_stamp_image(image_bytes, color, frame, scratch_level=scratch_level)
    logger.info("stamp-image update processed png_bytes=%s stamp_id=%s", len(png_bytes), stamp_id)
    updated = replace_stamp_image(stamp, png_bytes)
    logger.info("stamp-image update saved stamp_id=%s", updated.get("id"))

    return {
        "id": updated["id"],
        "image_url": updated["image_url"],
    }


def find_stamp(stamp_id: str) -> dict:
    try:
        stamp = get_stamp(stamp_id)
    except StampRepositoryError as error:
        logger.exception("stamp-image find failed stamp_id=%s", stamp_id)
        raise HTTPException(status_code=500, detail="Failed to get stamp") from error

    if stamp is None:
        logger.warning("stamp-image not found stamp_id=%s", stamp_id)
        raise HTTPException(status_code=404, detail="Stamp not found")
    return stamp


def replace_stamp_image(stamp: dict, png_bytes: bytes) -> dict:
    try:
        new_image_url = upload_stamp_image(png_bytes)
        updated = update_stamp_image_url(stamp["id"], new_image_url)
    except StampRepositoryError as error:
        logger.exception("stamp-image update save failed stamp_id=%s", stamp.get("id"))
        raise HTTPException(status_code=500, detail="Failed to update stamp") from error

    delete_stamp_image_by_url(stamp["image_url"])
    return updated


def save_stamp(
    png_bytes: bytes,
    *,
    user_id: str,
    latitude: float | None = None,
    longitude: float | None = None,
    spot_name: str | None = None,
    tilt_angle: float | None = None,
) -> dict:
    try:
        image_url = upload_stamp_image(png_bytes)
        return create_stamp(
            image_url,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            spot_name=spot_name,
            tilt_angle=tilt_angle,
        )
    except StampRepositoryError as error:
        logger.exception("stamp-image create save failed")
        raise HTTPException(status_code=500, detail="Failed to save stamp") from error


def validate_upload(image: UploadFile, image_bytes: bytes) -> None:
    validate_content_type(image)
    validate_image_body(image_bytes)


def validate_content_type(image: UploadFile) -> None:
    if image.content_type in ALLOWED_CONTENT_TYPES:
        return

    logger.warning("stamp-image unsupported content_type=%s", image.content_type)
    raise_bad_request("Unsupported image type")


def validate_image_body(image_bytes: bytes) -> None:
    if not image_bytes:
        logger.warning("stamp-image empty upload")
        raise_bad_request("Image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        logger.warning("stamp-image too large bytes=%s max=%s", len(image_bytes), MAX_IMAGE_BYTES)
        raise_bad_request("Image is too large")


def raise_bad_request(detail: str) -> NoReturn:
    raise HTTPException(status_code=400, detail=detail)


def validate_image_data(image_bytes: bytes) -> None:
    try:
        decode_image(image_bytes)
    except Exception:
        logger.exception("stamp-image decode failed bytes=%s", len(image_bytes))
        raise
