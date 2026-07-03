import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.clients.vision_client import Landmark, VisionClientError  # noqa: E402
from app.services.landmark_detector import (  # noqa: E402
    LandmarkDetectionServiceError,
    LandmarkNotFoundError,
    detect_primary_landmark,
)


class LandmarkDetectorTest(unittest.TestCase):
    def test_detect_primary_landmark_returns_highest_score_landmark(self):
        def detector(_image_bytes):
            return [
                Landmark(name="Tokyo Tower", score=0.72),
                Landmark(name="Shibuya Crossing", score=0.91),
                Landmark(name="Tokyo Skytree", score=0.86),
            ]

        landmark = detect_primary_landmark(b"image-bytes", detector=detector)

        self.assertEqual(landmark, Landmark(name="Shibuya Crossing", score=0.91))

    def test_detect_primary_landmark_raises_when_no_landmark_found(self):
        def detector(_image_bytes):
            return []

        with self.assertRaisesRegex(LandmarkNotFoundError, "No landmark found"):
            detect_primary_landmark(b"image-bytes", detector=detector)

    def test_detect_primary_landmark_wraps_vision_client_error(self):
        def detector(_image_bytes):
            raise VisionClientError("Vision API error")

        with self.assertRaisesRegex(
            LandmarkDetectionServiceError,
            "Failed to detect landmark",
        ):
            detect_primary_landmark(b"image-bytes", detector=detector)


if __name__ == "__main__":
    unittest.main()
