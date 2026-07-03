from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.core.config import ALLOWED_CONTENT_TYPES, MAX_IMAGE_BYTES
from app.services.stamp_processor import process_stamp_image

router = APIRouter()


@router.post("/stamp-image")
async def create_stamp_image_endpoint(image: Annotated[UploadFile, File()]):
    image_bytes = await image.read()
    validate_upload(image, image_bytes)

    png_bytes = process_stamp_image(image_bytes)

    return Response(content=png_bytes, media_type="image/png")


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


def raise_bad_request(detail: str) -> None:
    raise HTTPException(status_code=400, detail=detail)
