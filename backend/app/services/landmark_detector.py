from collections.abc import Callable

from app.clients.vision_client import Landmark, VisionClientError, detect_landmarks


class LandmarkDetectionError(Exception):
    pass


class LandmarkNotFoundError(LandmarkDetectionError):
    pass


class LandmarkDetectionServiceError(LandmarkDetectionError):
    pass


DetectLandmarks = Callable[[bytes], list[Landmark]]


def detect_primary_landmark(
    image_bytes: bytes,
    detector: DetectLandmarks = detect_landmarks,
) -> Landmark:
    try:
        landmarks = detector(image_bytes)
    except VisionClientError as error:
        raise LandmarkDetectionServiceError("Failed to detect landmark") from error

    if not landmarks:
        raise LandmarkNotFoundError("No landmark found")

    return max(landmarks, key=lambda landmark: landmark.score)
