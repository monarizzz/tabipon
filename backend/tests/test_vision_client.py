import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

from google.api_core.exceptions import GoogleAPIError

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.clients.vision_client import (
    Landmark,
    VisionClientError,
    detect_landmarks_with_client,
)


class VisionClientTest(unittest.TestCase):
    def test_detect_landmarks_returns_landmark_results(self):
        client = MagicMock()
        client.landmark_detection.return_value = SimpleNamespace(
            error=SimpleNamespace(message=""),
            landmark_annotations=[
                SimpleNamespace(description="Tokyo Tower", score=0.98),
                SimpleNamespace(description="Shibuya Crossing", score=0.82),
            ],
        )

        landmarks = detect_landmarks_with_client(b"image-bytes", client)

        self.assertEqual(
            landmarks,
            [
                Landmark(name="Tokyo Tower", score=0.98),
                Landmark(name="Shibuya Crossing", score=0.82),
            ],
        )
        client.landmark_detection.assert_called_once()

    def test_detect_landmarks_returns_empty_list_when_no_landmarks_found(self):
        client = MagicMock()
        client.landmark_detection.return_value = SimpleNamespace(
            error=SimpleNamespace(message=""),
            landmark_annotations=[],
        )

        landmarks = detect_landmarks_with_client(b"image-bytes", client)

        self.assertEqual(landmarks, [])

    def test_detect_landmarks_raises_error_when_response_has_error_message(self):
        client = MagicMock()
        client.landmark_detection.return_value = SimpleNamespace(
            error=SimpleNamespace(message="Vision API error"),
            landmark_annotations=[],
        )

        with self.assertRaisesRegex(VisionClientError, "Vision API error"):
            detect_landmarks_with_client(b"image-bytes", client)

    def test_detect_landmarks_wraps_google_api_errors(self):
        client = MagicMock()
        client.landmark_detection.side_effect = GoogleAPIError("network failed")

        with self.assertRaisesRegex(VisionClientError, "Failed to call Vision API"):
            detect_landmarks_with_client(b"image-bytes", client)


if __name__ == "__main__":
    unittest.main()
