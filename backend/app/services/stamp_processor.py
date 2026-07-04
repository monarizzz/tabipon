from enum import Enum

import cv2
import numpy as np
from fastapi import HTTPException

from app.core.config import STAMP_IMAGE_SIZE


class StampColor(str, Enum):
    red = "red"
    blue = "blue"
    black = "black"
    green = "green"


class StampFrame(str, Enum):
    simple = "simple"    # 細い一重円
    classic = "classic"  # 二重円
    dash = "dash"        # 破線の円
    wave = "wave"        # 波形の円


STAMP_COLORS: dict[StampColor, np.ndarray] = {
    StampColor.red: np.array([30, 50, 220], dtype=np.uint8),
    StampColor.blue: np.array([180, 60, 30], dtype=np.uint8),
    StampColor.black: np.array([30, 30, 30], dtype=np.uint8),
    StampColor.green: np.array([100, 130, 40], dtype=np.uint8),
}


def process_stamp_image(
    image_bytes: bytes,
    color: StampColor = StampColor.red,
    frame: StampFrame = StampFrame.classic,
    scratch_level: float = 0.0,
) -> bytes:
    decoded_image = decode_image(image_bytes)
    stamp_image = create_stamp_image(decoded_image, STAMP_COLORS[color], frame)
    if scratch_level > 0:
        stamp_image = apply_scratch(stamp_image, scratch_level)
    return encode_png(stamp_image)


def decode_image(image_bytes: bytes) -> np.ndarray:
    image_array = np.frombuffer(image_bytes, np.uint8)
    decoded_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if decoded_image is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
    return decoded_image


def create_stamp_image(image: np.ndarray, ink_color: np.ndarray, frame: StampFrame) -> np.ndarray:
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

    dark_pixels = (stamp_image[:, :, 0] < 180) & (stamp_image[:, :, 1] < 180) & (
        stamp_image[:, :, 2] < 180
    )
    stamp_image[dark_pixels] = ink_color

    return apply_circular_stamp_frame(stamp_image, ink_color, frame)


def crop_center_square(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    side = min(height, width)
    top = (height - side) // 2
    left = (width - side) // 2
    return image[top : top + side, left : left + side]


def apply_circular_stamp_frame(
    image: np.ndarray, ink_color: np.ndarray, frame: StampFrame
) -> np.ndarray:
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

    if frame == StampFrame.simple:
        cv2.circle(circular_stamp, center, radius, ink_color_tuple, 3)
    elif frame == StampFrame.classic:
        cv2.circle(circular_stamp, center, radius, ink_color_tuple, 10)
        cv2.circle(circular_stamp, center, radius - 30, ink_color_tuple, 3)
    elif frame == StampFrame.dash:
        _draw_dashed_circle(circular_stamp, center, radius, ink_color_tuple, thickness=4, dash_count=24)
    elif frame == StampFrame.wave:
        _draw_wave_circle(circular_stamp, center, radius, ink_color_tuple, thickness=4, wave_count=12, wave_amplitude=6)

    return circular_stamp


def _draw_dashed_circle(
    image: np.ndarray,
    center: tuple[int, int],
    radius: int,
    color: tuple[int, ...],
    thickness: int,
    dash_count: int,
) -> None:
    for i in range(dash_count):
        if i % 2 == 0:
            continue
        start_angle = i * 360 / dash_count
        end_angle = (i + 1) * 360 / dash_count
        cv2.ellipse(image, center, (radius, radius), 0, start_angle, end_angle, color, thickness)


def _draw_wave_circle(
    image: np.ndarray,
    center: tuple[int, int],
    radius: int,
    color: tuple[int, ...],
    thickness: int,
    wave_count: int,
    wave_amplitude: int,
) -> None:
    import math
    num_points = 720
    pts = []
    for i in range(num_points):
        angle = 2 * math.pi * i / num_points
        r = radius + wave_amplitude * math.sin(wave_count * angle)
        x = int(center[0] + r * math.cos(angle))
        y = int(center[1] + r * math.sin(angle))
        pts.append([[x, y]])
    pts_array = np.array(pts, dtype=np.int32)
    cv2.polylines(image, [pts_array], isClosed=True, color=color, thickness=thickness)


def apply_scratch(image: np.ndarray, scratch_level: float) -> np.ndarray:
    h, w = image.shape[:2]
    noise = np.random.normal(0, 1, (h, w)).astype(np.float32)
    noise = cv2.GaussianBlur(noise, (15, 15), 0)
    noise = (noise - noise.min()) / (noise.max() - noise.min())
    threshold = 1.0 - scratch_level * 0.5
    scratch_mask = noise > threshold
    result = image.copy()
    result[scratch_mask] = [255, 255, 255]
    return result


def encode_png(image: np.ndarray) -> bytes:
    success, encoded_image = cv2.imencode(".png", image)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode stamp image")
    return encoded_image.tobytes()
