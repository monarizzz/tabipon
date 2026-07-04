from typing import Annotated, NoReturn

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.clients.vision_client import Landmark
from app.core.config import ALLOWED_CONTENT_TYPES, MAX_IMAGE_BYTES
from app.repositories.stamp_repository import (
    StampRepositoryError,
    create_stamp,
    find_or_create_spot,
    upload_stamp_image,
)
from app.services.landmark_detector import (
    LandmarkDetectionServiceError,
    LandmarkNotFoundError,
    detect_primary_landmark,
)
from app.services.stamp_processor import StampColor, decode_image, process_stamp_image

router = APIRouter()


@router.post("/stamp-image")
async def create_stamp_image_endpoint(
    image: Annotated[UploadFile, File()],
    color: StampColor = StampColor.red,
):
    image_bytes = await image.read()
    validate_upload(image, image_bytes)
    validate_image_data(image_bytes)
    landmark = detect_landmark(image_bytes)

    png_bytes = process_stamp_image(image_bytes, color)
    stamp = save_stamp(landmark, png_bytes)

    return {
        "id": stamp["id"],
        "landmark_name": landmark.name,
        "image_url": stamp["image_url"],
    }


def save_stamp(landmark: Landmark, png_bytes: bytes) -> dict:
    try:
        image_url = upload_stamp_image(png_bytes)
        spot_id = find_or_create_spot(landmark.name, landmark.latitude, landmark.longitude)
        return create_stamp(spot_id, image_url)
    except StampRepositoryError as error:
        raise HTTPException(status_code=500, detail="Failed to save stamp") from error


def validate_upload(image: UploadFile, image_bytes: bytes) -> None:
    validate_content_type(image)
    validate_image_body(image_bytes)


def validate_content_type(image: UploadFile) -> None:
    if image.content_type in ALLOWED_CONTENT_TYPES:
        return

    raise_bad_request("Unsupported image type")


def validate_image_body(image_bytes: bytes) -> None:
    if not image_bytes:
        raise_bad_request("Image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise_bad_request("Image is too large")


def raise_bad_request(detail: str) -> NoReturn:
    raise HTTPException(status_code=400, detail=detail)


def validate_image_data(image_bytes: bytes) -> None:
    decode_image(image_bytes)


def detect_landmark(image_bytes: bytes) -> Landmark:
    try:
        return detect_primary_landmark(image_bytes)
    except LandmarkNotFoundError:
        raise_bad_request("No landmark found")
    except LandmarkDetectionServiceError as error:
        raise HTTPException(status_code=500, detail="Failed to detect landmark") from error
