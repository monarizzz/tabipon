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

from app.clients.vision_client import Landmark  # noqa: E402
from app.core.config import MAX_IMAGE_BYTES  # noqa: E402
from app.repositories.stamp_repository import StampRepositoryError  # noqa: E402
from app.services.landmark_detector import (  # noqa: E402
    LandmarkDetectionServiceError,
    LandmarkNotFoundError,
)
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


TEST_LANDMARK = Landmark(
    name="Tokyo Tower",
    score=0.98,
    latitude=35.6586,
    longitude=139.7454,
)
TEST_IMAGE_URL = "https://test.supabase.co/storage/v1/object/public/stamps/test.png"


class StampImageApiTest(unittest.TestCase):
    @patch("app.api.routes.stamp_image.create_stamp")
    @patch("app.api.routes.stamp_image.find_or_create_spot")
    @patch("app.api.routes.stamp_image.upload_stamp_image")
    @patch("app.api.routes.stamp_image.detect_primary_landmark")
    def test_stamp_image_saves_stamp_and_returns_json(
        self,
        detect_landmark,
        upload_stamp_image,
        find_or_create_spot,
        create_stamp,
    ):
        detect_landmark.return_value = TEST_LANDMARK
        upload_stamp_image.return_value = TEST_IMAGE_URL
        find_or_create_spot.return_value = 1
        create_stamp.return_value = {"id": 10, "image_url": TEST_IMAGE_URL}
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": 10,
                "landmark_name": "Tokyo Tower",
                "image_url": TEST_IMAGE_URL,
            },
        )
        find_or_create_spot.assert_called_once_with("Tokyo Tower", 35.6586, 139.7454)
        create_stamp.assert_called_once_with(1, TEST_IMAGE_URL)

    @patch("app.api.routes.stamp_image.upload_stamp_image")
    @patch("app.api.routes.stamp_image.detect_primary_landmark")
    def test_stamp_image_returns_server_error_when_save_fails(
        self,
        detect_landmark,
        upload_stamp_image,
    ):
        detect_landmark.return_value = TEST_LANDMARK
        upload_stamp_image.side_effect = StampRepositoryError("upload failed")
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to save stamp"})

    @patch("app.api.routes.stamp_image.detect_primary_landmark")
    def test_stamp_image_rejects_image_without_landmark(self, detect_landmark):
        detect_landmark.side_effect = LandmarkNotFoundError("No landmark found")
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "No landmark found"})

    @patch("app.api.routes.stamp_image.detect_primary_landmark")
    def test_stamp_image_returns_server_error_when_landmark_detection_fails(
        self,
        detect_landmark,
    ):
        detect_landmark.side_effect = LandmarkDetectionServiceError(
            "Failed to detect landmark",
        )
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to detect landmark"})

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


if __name__ == "__main__":
    unittest.main()
