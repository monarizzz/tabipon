import os
from pathlib import Path


MAX_IMAGE_BYTES = 4 * 1024 * 1024
STAMP_IMAGE_SIZE = 512
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE_PATH = BACKEND_DIR / ".env"


def load_env_file(env_file_path: Path = ENV_FILE_PATH) -> None:
    if not env_file_path.exists():
        return

    for line in env_file_path.read_text().splitlines():
        key_value = parse_env_line(line)
        if key_value is None:
            continue

        key, value = key_value
        os.environ.setdefault(key, value)


def parse_env_line(line: str) -> tuple[str, str] | None:
    stripped_line = line.strip()
    if not stripped_line or stripped_line.startswith("#"):
        return None

    if stripped_line.startswith("export "):
        stripped_line = stripped_line.removeprefix("export ").strip()

    if "=" not in stripped_line:
        return None

    key, value = stripped_line.split("=", 1)
    key = key.strip()
    value = value.strip().strip("\"'")

    if not key:
        return None

    return key, value
