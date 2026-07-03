import cv2
import numpy as np
from fastapi import HTTPException

from app.core.config import STAMP_IMAGE_SIZE


def process_stamp_image(image_bytes: bytes) -> bytes:
    decoded_image = decode_image(image_bytes)
    stamp_image = create_stamp_image(decoded_image)
    return encode_png(stamp_image)


def decode_image(image_bytes: bytes) -> np.ndarray:
    image_array = np.frombuffer(image_bytes, np.uint8)
    decoded_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if decoded_image is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
    return decoded_image


def create_stamp_image(image: np.ndarray) -> np.ndarray:
    square_image = crop_center_square(image)
    resized_image = cv2.resize(
        square_image,
        (STAMP_IMAGE_SIZE, STAMP_IMAGE_SIZE),
        interpolation=cv2.INTER_AREA,
    )

    gray_image = cv2.cvtColor(resized_image, cv2.COLOR_BGR2GRAY)
    blurred_image = cv2.GaussianBlur(gray_image, (5, 5), 0)
    thresholded_image = cv2.adaptiveThreshold(
        blurred_image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        7,
    )

    edges = cv2.Canny(blurred_image, 60, 160)
    line_art = cv2.bitwise_and(thresholded_image, cv2.bitwise_not(edges))
    stamp_image = cv2.cvtColor(line_art, cv2.COLOR_GRAY2BGR)

    ink_color = np.array([45, 63, 185], dtype=np.uint8)
    dark_pixels = (stamp_image[:, :, 0] < 180) & (stamp_image[:, :, 1] < 180) & (
        stamp_image[:, :, 2] < 180
    )
    stamp_image[dark_pixels] = ink_color

    return apply_circular_stamp_frame(stamp_image, ink_color)


def crop_center_square(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    side = min(height, width)
    top = (height - side) // 2
    left = (width - side) // 2
    return image[top : top + side, left : left + side]


def apply_circular_stamp_frame(image: np.ndarray, ink_color: np.ndarray) -> np.ndarray:
    radius = STAMP_IMAGE_SIZE // 2 - 8
    center = (STAMP_IMAGE_SIZE // 2, STAMP_IMAGE_SIZE // 2)
    ink_color_tuple = tuple(int(value) for value in ink_color)

    mask = np.zeros((STAMP_IMAGE_SIZE, STAMP_IMAGE_SIZE), dtype=np.uint8)
    cv2.circle(mask, center, radius, 255, -1)

    circular_stamp = np.full(
        (STAMP_IMAGE_SIZE, STAMP_IMAGE_SIZE, 3),
        255,
        dtype=np.uint8,
    )
    circular_stamp[mask == 255] = image[mask == 255]
    cv2.circle(circular_stamp, center, radius, ink_color_tuple, 10)
    cv2.circle(circular_stamp, center, radius - 30, ink_color_tuple, 3)

    return circular_stamp


def encode_png(image: np.ndarray) -> bytes:
    success, encoded_image = cv2.imencode(".png", image)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode stamp image")
    return encoded_image.tobytes()
