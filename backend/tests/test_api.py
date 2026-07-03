import sys
import unittest
from pathlib import Path

import cv2
import numpy as np
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import MAX_IMAGE_BYTES  # noqa: E402
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


class StampImageApiTest(unittest.TestCase):
    def test_stamp_image_accepts_jpeg_and_returns_png(self):
        image_bytes = create_jpeg_bytes()

        response = client.post(
            "/stamp-image",
            files={"image": ("test.jpg", image_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/png")
        self.assertGreater(len(response.content), 0)

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
