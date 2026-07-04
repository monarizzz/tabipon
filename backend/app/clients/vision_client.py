from dataclasses import dataclass

from google.api_core.exceptions import GoogleAPIError
from google.cloud import vision


class VisionClientError(Exception):
    pass


@dataclass(frozen=True)
class Landmark:
    name: str
    score: float
    latitude: float | None = None
    longitude: float | None = None


def detect_landmarks(image_bytes: bytes) -> list[Landmark]:
    client = vision.ImageAnnotatorClient()
    return detect_landmarks_with_client(image_bytes, client)


def detect_landmarks_with_client(image_bytes: bytes, client) -> list[Landmark]:
    image = vision.Image(content=image_bytes)

    try:
        response = client.landmark_detection(image=image)
    except GoogleAPIError as error:
        raise VisionClientError("Failed to call Vision API") from error

    if response.error.message:
        raise VisionClientError(response.error.message)

    return [build_landmark(annotation) for annotation in response.landmark_annotations]


def build_landmark(annotation) -> Landmark:
    latitude = None
    longitude = None
    if annotation.locations:
        lat_lng = annotation.locations[0].lat_lng
        latitude = lat_lng.latitude
        longitude = lat_lng.longitude

    return Landmark(
        name=annotation.description,
        score=annotation.score,
        latitude=latitude,
        longitude=longitude,
    )
