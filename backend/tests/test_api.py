import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import cv2
import numpy as np
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

from app.core.config import MAX_IMAGE_BYTES  # noqa: E402
from app.repositories.stamp_repository import StampRepositoryError  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def create_jpeg_bytes() -> bytes:
    image = np.full((32, 32, 3), 255, dtype=np.uint8)
    cv2.circle(image, (16, 16), 10, (0, 0, 255), -1)

    success, encoded_image = cv2.imencode(".jpg", image)
    if not success:
        raise RuntimeError("Failed to create test image")

    return encoded_image.tobytes()


class HealthApiTest(unittest.TestCase):
    def test_health_returns_ok(self):
        response = client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


TEST_IMAGE_URL = "https://test.supabase.co/storage/v1/object/public/stamps/test.png"
TEST_STAMP_ID = "11111111-1111-1111-1111-111111111111"


class StampImageApiTest(unittest.TestCase):
    @patch("app.api.routes.stamp_image.create_stamp")
    @patch("app.api.routes.stamp_image.upload_stamp_image")
    def test_stamp_image_saves_stamp_and_returns_json(
        self,
        upload_stamp_image,
        create_stamp,
    ):
        upload_stamp_image.return_value = TEST_IMAGE_URL
        create_stamp.return_value = {"id": TEST_STAMP_ID, "image_url": TEST_IMAGE_URL}
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": TEST_STAMP_ID,
                "image_url": TEST_IMAGE_URL,
            },
        )
        create_stamp.assert_called_once_with(
            TEST_IMAGE_URL,
            latitude=None,
            longitude=None,
            spot_name=None,
            tilt_angle=None,
        )

    @patch("app.api.routes.stamp_image.create_stamp")
    @patch("app.api.routes.stamp_image.upload_stamp_image")
    def test_stamp_image_forwards_location(
        self,
        upload_stamp_image,
        create_stamp,
    ):
        upload_stamp_image.return_value = TEST_IMAGE_URL
        create_stamp.return_value = {"id": TEST_STAMP_ID, "image_url": TEST_IMAGE_URL}
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
            data={"latitude": "35.681236", "longitude": "139.767125", "spot_name": "東京駅"},
        )

        self.assertEqual(response.status_code, 200)
        create_stamp.assert_called_once_with(
            TEST_IMAGE_URL,
            latitude=35.681236,
            longitude=139.767125,
            spot_name="東京駅",
            tilt_angle=None,
        )

    @patch("app.api.routes.stamp_image.upload_stamp_image")
    def test_stamp_image_returns_server_error_when_save_fails(
        self,
        upload_stamp_image,
    ):
        upload_stamp_image.side_effect = StampRepositoryError("upload failed")
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to save stamp"})

    def test_stamp_image_rejects_empty_file(self):
        response = client.post(
            "/stamp-image",
            files={"image": ("empty.jpg", b"", "image/jpeg")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Image is empty"})

    def test_stamp_image_rejects_unsupported_content_type(self):
        response = client.post(
            "/stamp-image",
            files={"image": ("test.txt", b"not an image", "text/plain")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Unsupported image type"})

    def test_stamp_image_rejects_invalid_image_data(self):
        response = client.post(
            "/stamp-image",
            files={"image": ("broken.jpg", b"not an image", "image/jpeg")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid image data"})

    def test_stamp_image_rejects_large_file(self):
        response = client.post(
            "/stamp-image",
            files={
                "image": (
                    "large.jpg",
                    b"0" * (MAX_IMAGE_BYTES + 1),
                    "image/jpeg",
                )
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Image is too large"})


NEW_IMAGE_URL = "https://test.supabase.co/storage/v1/object/public/stamps/new.png"


class StampImageUpdateApiTest(unittest.TestCase):
    @patch("app.api.routes.stamp_image.delete_stamp_image_by_url")
    @patch("app.api.routes.stamp_image.update_stamp_image_url")
    @patch("app.api.routes.stamp_image.upload_stamp_image")
    @patch("app.api.routes.stamp_image.get_stamp")
    def test_update_stamp_image_replaces_image(
        self,
        get_stamp,
        upload_stamp_image,
        update_stamp_image_url,
        delete_stamp_image_by_url,
    ):
        get_stamp.return_value = {"id": TEST_STAMP_ID, "image_url": TEST_IMAGE_URL}
        upload_stamp_image.return_value = NEW_IMAGE_URL
        update_stamp_image_url.return_value = {"id": TEST_STAMP_ID, "image_url": NEW_IMAGE_URL}
        image_bytes = create_jpeg_bytes()

        response = client.put(
            f"/stamp-image/{TEST_STAMP_ID}",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
            data={"color": "blue"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"id": TEST_STAMP_ID, "image_url": NEW_IMAGE_URL})
        update_stamp_image_url.assert_called_once_with(TEST_STAMP_ID, NEW_IMAGE_URL)
        delete_stamp_image_by_url.assert_called_once_with(TEST_IMAGE_URL)

    @patch("app.api.routes.stamp_image.get_stamp")
    def test_update_stamp_image_returns_not_found_for_missing_stamp(self, get_stamp):
        get_stamp.return_value = None
        image_bytes = create_jpeg_bytes()

        response = client.put(
            "/stamp-image/999",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Stamp not found"})

    def test_update_stamp_image_rejects_empty_file(self):
        response = client.put(
            f"/stamp-image/{TEST_STAMP_ID}",
            files={"image": ("empty.jpg", b"", "image/jpeg")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Image is empty"})

    @patch("app.api.routes.stamp_image.upload_stamp_image")
    @patch("app.api.routes.stamp_image.get_stamp")
    def test_update_stamp_image_returns_server_error_when_upload_fails(
        self,
        get_stamp,
        upload_stamp_image,
    ):
        get_stamp.return_value = {"id": TEST_STAMP_ID, "image_url": TEST_IMAGE_URL}
        upload_stamp_image.side_effect = StampRepositoryError("upload failed")
        image_bytes = create_jpeg_bytes()

        response = client.put(
            f"/stamp-image/{TEST_STAMP_ID}",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to update stamp"})


class StampsApiTest(unittest.TestCase):
    @patch("app.api.routes.stamps.list_stamps")
    def test_stamps_returns_items(self, list_stamps):
        list_stamps.return_value = [
            {
                "id": TEST_STAMP_ID,
                "image_url": TEST_IMAGE_URL,
                "acquired_at": "2026-07-04T00:00:00+00:00",
                "latitude": 35.681236,
                "longitude": 139.767125,
                "spot_name": "東京駅",
                "tilt_angle": None,
            },
        ]

        response = client.get("/stamps")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": TEST_STAMP_ID,
                    "image_url": TEST_IMAGE_URL,
                    "acquired_at": "2026-07-04T00:00:00+00:00",
                    "latitude": 35.681236,
                    "longitude": 139.767125,
                    "spot_name": "東京駅",
                    "tilt_angle": None,
                },
            ],
        )

    @patch("app.api.routes.stamps.list_stamps")
    def test_stamps_returns_empty_list(self, list_stamps):
        list_stamps.return_value = []

        response = client.get("/stamps")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    @patch("app.api.routes.stamps.list_stamps")
    def test_stamps_returns_server_error_when_repository_fails(self, list_stamps):
        list_stamps.side_effect = StampRepositoryError("query failed")

        response = client.get("/stamps")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to list stamps"})


class StampDeleteApiTest(unittest.TestCase):
    @patch("app.api.routes.stamps.delete_stamp_image_by_url")
    @patch("app.api.routes.stamps.delete_stamp")
    @patch("app.api.routes.stamps.get_stamp")
    def test_delete_stamp_removes_record_and_image(
        self,
        get_stamp,
        delete_stamp,
        delete_stamp_image_by_url,
    ):
        get_stamp.return_value = {"id": TEST_STAMP_ID, "image_url": TEST_IMAGE_URL}

        response = client.delete(f"/stamps/{TEST_STAMP_ID}")

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        delete_stamp.assert_called_once_with(TEST_STAMP_ID)
        delete_stamp_image_by_url.assert_called_once_with(TEST_IMAGE_URL)

    @patch("app.api.routes.stamps.get_stamp")
    def test_delete_stamp_returns_not_found_for_missing_stamp(self, get_stamp):
        get_stamp.return_value = None

        response = client.delete(f"/stamps/{TEST_STAMP_ID}")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Stamp not found"})

    @patch("app.api.routes.stamps.delete_stamp")
    @patch("app.api.routes.stamps.get_stamp")
    def test_delete_stamp_returns_server_error_when_delete_fails(
        self,
        get_stamp,
        delete_stamp,
    ):
        get_stamp.return_value = {"id": TEST_STAMP_ID, "image_url": TEST_IMAGE_URL}
        delete_stamp.side_effect = StampRepositoryError("delete failed")

        response = client.delete(f"/stamps/{TEST_STAMP_ID}")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to delete stamp"})


if __name__ == "__main__":
    unittest.main()
