import uuid
from datetime import datetime, timezone

from app.clients.supabase_client import get_supabase

STAMP_BUCKET = "stamps"


class StampRepositoryError(Exception):
    pass


def upload_stamp_image(png_bytes: bytes) -> str:
    file_path = f"{uuid.uuid4()}.png"

    try:
        storage = get_supabase().storage.from_(STAMP_BUCKET)
        storage.upload(file_path, png_bytes, {"content-type": "image/png"})
        return storage.get_public_url(file_path)
    except Exception as error:
        raise StampRepositoryError("Failed to upload stamp image") from error


def get_stamp(stamp_id: str) -> dict | None:
    try:
        result = (
            get_supabase()
            .table("stamps")
            .select("*")
            .eq("id", stamp_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as error:
        raise StampRepositoryError("Failed to get stamp") from error


def update_stamp_image_url(stamp_id: str, image_url: str) -> dict:
    try:
        updated = (
            get_supabase()
            .table("stamps")
            .update({"image_url": image_url})
            .eq("id", stamp_id)
            .execute()
        )
        return updated.data[0]
    except Exception as error:
        raise StampRepositoryError("Failed to update stamp record") from error


def delete_stamp_image_by_url(image_url: str) -> None:
    # 色変更で置き換えた旧画像の後始末。失敗してもスタンプ自体は有効なので握りつぶす
    try:
        file_path = image_url.split("?")[0].rsplit("/", 1)[-1]
        get_supabase().storage.from_(STAMP_BUCKET).remove([file_path])
    except Exception:
        pass


def list_stamps() -> list[dict]:
    try:
        result = (
            get_supabase()
            .table("stamps")
            .select("id, image_url, acquired_at")
            .order("acquired_at", desc=True)
            .execute()
        )
        return result.data
    except Exception as error:
        raise StampRepositoryError("Failed to list stamps") from error


def create_stamp(image_url: str) -> dict:
    try:
        created = (
            get_supabase()
            .table("stamps")
            .insert(
                {
                    "image_url": image_url,
                    "acquired_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )
        return created.data[0]
    except Exception as error:
        raise StampRepositoryError("Failed to create stamp record") from error
