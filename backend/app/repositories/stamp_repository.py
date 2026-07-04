import uuid
from datetime import datetime, timezone

from app.clients.supabase_client import get_supabase

STAMP_BUCKET = "stamps"


class StampRepositoryError(Exception):
    pass


def upload_stamp_image(png_bytes: bytes) -> str:
    file_path = f"{uuid.uuid4()}.png"
    storage = get_supabase().storage.from_(STAMP_BUCKET)

    try:
        storage.upload(file_path, png_bytes, {"content-type": "image/png"})
        return storage.get_public_url(file_path)
    except Exception as error:
        raise StampRepositoryError("Failed to upload stamp image") from error


def find_or_create_spot(
    name: str,
    latitude: float | None,
    longitude: float | None,
) -> int:
    try:
        spots = get_supabase().table("spots")

        existing = spots.select("id").eq("name", name).limit(1).execute()
        if existing.data:
            return existing.data[0]["id"]

        created = spots.insert(
            {"name": name, "latitude": latitude, "longitude": longitude}
        ).execute()
        return created.data[0]["id"]
    except StampRepositoryError:
        raise
    except Exception as error:
        raise StampRepositoryError("Failed to find or create spot") from error


def create_stamp(spot_id: int, image_url: str) -> dict:
    try:
        created = (
            get_supabase()
            .table("stamps")
            .insert(
                {
                    "spot_id": spot_id,
                    "image_url": image_url,
                    "acquired_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )
        return created.data[0]
    except Exception as error:
        raise StampRepositoryError("Failed to create stamp record") from error
