"""現行 backend の process_stamp_image() を使い、比較用のスタンプサンプル PNG を書き出すスクリプト。

Refs: #120, #98

## 背景

Epic #98 でスタンプ画像生成を react-native-skia に移植する。移植後の見た目が現行 backend の
出力と比べて許容範囲かを判断するためのサンプルを、backend/ が削除される(#103)前に固定しておく。

## 実行方法（リポジトリルートから）

    backend/.venv/bin/python backend/scripts/generate_stamp_samples.py

入力画像を指定しない場合は、スクリプトが合成テスト画像を生成して使う。
実写真が用意できたら --input で指定して再生成できる。

    backend/.venv/bin/python backend/scripts/generate_stamp_samples.py --input /path/to/photo.jpg

出力先はデフォルトで docs/stamp-samples/ 。既存の出力は実行のたびに上書きされる。
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.stamp_processor import (  # noqa: E402
    StampColor,
    StampFrame,
    process_stamp_image,
)

DEFAULT_OUTPUT_DIR = REPO_ROOT / "docs" / "stamp-samples"
# process_stamp_image は正方形に切り出した上で STAMP_IMAGE_SIZE(512) にリサイズするため、
# 入力側をこれより大きくしても比較の意味は薄い。ファイルサイズを抑えるため 512 に合わせる。
SYNTHETIC_IMAGE_SIZE = 512
SYNTHETIC_SEED = 42
PNG_COMPRESSION_PARAMS = [cv2.IMWRITE_PNG_COMPRESSION, 9]

COLORS = [StampColor.red, StampColor.blue, StampColor.black, StampColor.green]
FRAMES = [StampFrame.simple, StampFrame.classic, StampFrame.dash, StampFrame.wave]

# 掠れ・回転の有無を確認する数パターン。base の16通りとは別に、雰囲気を見るための参考として出す。
VARIANTS: list[dict] = [
    {
        "name": "scratch_light",
        "color": StampColor.red,
        "frame": StampFrame.classic,
        "scratch_level": 0.2,
        "tilt_angle": 0.0,
    },
    {
        "name": "scratch_heavy",
        "color": StampColor.red,
        "frame": StampFrame.classic,
        "scratch_level": 0.6,
        "tilt_angle": 0.0,
    },
    {
        "name": "tilt_15deg",
        "color": StampColor.red,
        "frame": StampFrame.classic,
        "scratch_level": 0.0,
        "tilt_angle": 15.0,
    },
    {
        "name": "scratch_and_tilt",
        "color": StampColor.red,
        "frame": StampFrame.classic,
        "scratch_level": 0.4,
        "tilt_angle": 20.0,
    },
]


def build_synthetic_test_image(size: int = SYNTHETIC_IMAGE_SIZE, seed: int = SYNTHETIC_SEED) -> np.ndarray:
    """adaptiveThreshold / Canny の挙動が見える程度の内容を持つ合成テスト画像を作る。

    含む要素:
    - 横方向グラデーション（明暗差）
    - チェッカーボード状の細かいテクスチャ領域（局所2値化の挙動確認用）
    - 塗りの円・矩形・線（エッジ・輪郭確認用）
    - 白黒の小さいドット群（adaptiveThreshold の局所窓の挙動確認用）
    - ガウスノイズ（ざらつき・掠れ処理の見え方確認用）

    実写真とは異なり、被写体の意味的な構造は無い。線画化・フレームの比較用途に限定される。
    """
    rng = np.random.default_rng(seed)

    x = np.linspace(0, 255, size, dtype=np.float32)
    gradient = np.tile(x, (size, 1)).astype(np.uint8)
    image = cv2.cvtColor(gradient, cv2.COLOR_GRAY2BGR)

    # 左上: 細かいチェッカーボードテクスチャ
    tile = 6
    checker = (((np.indices((size, size))[0] // tile) + (np.indices((size, size))[1] // tile)) % 2) * 255
    checker = checker.astype(np.uint8)
    half = size // 2
    texture_bgr = cv2.cvtColor(checker[:half, :half], cv2.COLOR_GRAY2BGR)
    image[:half, :half] = texture_bgr

    # 右上: 塗りの円（エッジ確認用）
    cv2.circle(image, (size * 3 // 4, size // 4), size // 6, (40, 40, 40), -1)

    # 左下: 塗りの矩形と対角線
    cv2.rectangle(
        image,
        (size // 8, size * 5 // 8),
        (size * 3 // 8, size * 7 // 8),
        (20, 20, 20),
        -1,
    )
    cv2.line(image, (size // 2, size * 3 // 4), (size - 20, size - 20), (10, 10, 10), 8)

    # 右下: 白黒の小さいドット群（局所2値化の窓サイズが効く領域）
    for _ in range(40):
        cx = int(rng.integers(size * 5 // 8, size - 10))
        cy = int(rng.integers(size * 5 // 8, size - 10))
        r = int(rng.integers(4, 14))
        color = (0, 0, 0) if rng.random() > 0.5 else (255, 255, 255)
        cv2.circle(image, (cx, cy), r, color, -1)

    # 全体にガウスノイズを重ねてざらつきを出す
    noise = rng.normal(0, 18, image.shape).astype(np.float32)
    noisy = np.clip(image.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    return noisy


def load_input_image_bytes(input_path: Path | None, output_dir: Path) -> tuple[bytes, str]:
    """入力画像の bytes と、manifest に残す説明文字列を返す。

    input_path が指定されなければ合成テスト画像を生成し、input/ 配下に保存してから使う。
    """
    input_dir = output_dir / "input"
    input_dir.mkdir(parents=True, exist_ok=True)

    if input_path is not None:
        image_bytes = input_path.read_bytes()
        description = f"実写真（--input で指定): {input_path.name}"
        return image_bytes, description

    synthetic_image = build_synthetic_test_image()
    synthetic_path = input_dir / "synthetic_test_image.png"
    success, encoded = cv2.imencode(".png", synthetic_image, PNG_COMPRESSION_PARAMS)
    if not success:
        raise RuntimeError("Failed to encode synthetic test image")
    synthetic_path.write_bytes(encoded.tobytes())
    description = (
        "合成テスト画像（スクリプトが自動生成。実写真ではない。"
        "docs/stamp-samples/README.md の限界の節を参照）"
    )
    return encoded.tobytes(), description


def generate_samples(output_dir: Path, input_path: Path | None) -> dict:
    image_bytes, input_description = load_input_image_bytes(input_path, output_dir)

    base_dir = output_dir / "output" / "base"
    variants_dir = output_dir / "output" / "variants"
    base_dir.mkdir(parents=True, exist_ok=True)
    variants_dir.mkdir(parents=True, exist_ok=True)

    manifest: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cv2_version": cv2.__version__,
        "input": {
            "description": input_description,
            "path": (
                str(input_path) if input_path is not None else "input/synthetic_test_image.png"
            ),
            "is_synthetic": input_path is None,
        },
        "base": [],
        "variants": [],
    }

    for color in COLORS:
        for frame in FRAMES:
            params = {
                "color": color.value,
                "frame": frame.value,
                "scratch_level": 0.0,
                "tilt_angle": 0.0,
            }
            png_bytes = process_stamp_image(
                image_bytes,
                color=color,
                frame=frame,
                scratch_level=params["scratch_level"],
                tilt_angle=params["tilt_angle"],
            )
            file_name = f"{color.value}_{frame.value}.png"
            (base_dir / file_name).write_bytes(png_bytes)
            manifest["base"].append({"file": f"output/base/{file_name}", **params})

    for variant in VARIANTS:
        params = {
            "color": variant["color"].value,
            "frame": variant["frame"].value,
            "scratch_level": variant["scratch_level"],
            "tilt_angle": variant["tilt_angle"],
        }
        png_bytes = process_stamp_image(
            image_bytes,
            color=variant["color"],
            frame=variant["frame"],
            scratch_level=params["scratch_level"],
            tilt_angle=params["tilt_angle"],
        )
        file_name = f"{variant['name']}.png"
        (variants_dir / file_name).write_bytes(png_bytes)
        manifest["variants"].append({"file": f"output/variants/{file_name}", **params})

    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=None,
        help="入力画像のパス。指定しない場合は合成テスト画像を生成して使う。",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"出力先ディレクトリ（デフォルト: {DEFAULT_OUTPUT_DIR}）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir: Path = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = generate_samples(output_dir, args.input)

    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    total_files = len(manifest["base"]) + len(manifest["variants"]) + 1
    print(f"Wrote {total_files} PNG files and manifest.json to {output_dir}")


if __name__ == "__main__":
    main()
