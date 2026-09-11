"""現行 backend の process_stamp_image() を使い、比較用のスタンプサンプル PNG を書き出すスクリプト。

Refs: #120, #98

## 背景

Epic #98 でスタンプ画像生成を react-native-skia に移植する。移植後の見た目が現行 backend の
出力と比べて許容範囲かを判断するためのサンプルを、backend/ が削除される(#103)前に固定しておく。

## 実行方法（リポジトリルートから）

主サンプル（平等院、4色×4フレーム16通り + 掠れ・回転の参考パターン）:

    backend/.venv/bin/python backend/scripts/generate_stamp_samples.py \\
        --input docs/stamp-samples/input/byodoin-uji-kyoto.jpg \\
        --source-key byodoin \\
        --author "GiveMeMollusks" \\
        --source-url "https://commons.wikimedia.org/wiki/File:By%C5%8Ddo-in_Temple_in_Uji,_Kyoto,_Japan.jpg" \\
        --license "CC0 1.0" \\
        --with-variants

副サンプル（雪山、少数のみ・variants無し）:

    backend/.venv/bin/python backend/scripts/generate_stamp_samples.py \\
        --input docs/stamp-samples/input/hida-mountains.jpg \\
        --source-key hida-mountains \\
        --author "Wall Boat" \\
        --source-url "https://commons.wikimedia.org/wiki/File:Hida_Mountains,_Japan.jpg" \\
        --license "CC0 1.0" \\
        --colors black \\
        --output-subdir hida-mountains

`--input` を省略すると、合成テスト画像（チェッカーボード・グラデーション・図形・ノイズ）を生成して使う
フォールバックが動く（実写真が用意できない状況向け。現在の主サンプルは実写真を使用しているため通常は不要）。

各呼び出しの結果は `manifest.json` の `sources` にキーごとにマージされる（既存の他ソースは残る）。
出力先はデフォルトで docs/stamp-samples/ 。
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
# 入力側をこれより大きくしても比較の意味は薄い。合成画像フォールバックはファイルサイズを抑えるため 512 にする。
SYNTHETIC_IMAGE_SIZE = 512
SYNTHETIC_SEED = 42
PNG_COMPRESSION_PARAMS = [cv2.IMWRITE_PNG_COMPRESSION, 9]

ALL_COLORS = {c.value: c for c in StampColor}
ALL_FRAMES = {f.value: f for f in StampFrame}

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

    実写真が用意できない場合のフォールバック用。含む要素:
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


def load_input_image_bytes(
    input_path: Path | None, output_dir: Path
) -> tuple[bytes, dict]:
    """入力画像の bytes と、manifest に残すメタデータ dict を返す。

    input_path が指定されなければ合成テスト画像を生成し、input/ 配下に保存してから使う。
    """
    if input_path is not None:
        image_bytes = input_path.read_bytes()
        metadata = {
            "kind": "photo",
            "file": f"input/{input_path.name}",
        }
        return image_bytes, metadata

    input_dir = output_dir / "input"
    input_dir.mkdir(parents=True, exist_ok=True)
    synthetic_image = build_synthetic_test_image()
    synthetic_path = input_dir / "synthetic_test_image.png"
    success, encoded = cv2.imencode(".png", synthetic_image, PNG_COMPRESSION_PARAMS)
    if not success:
        raise RuntimeError("Failed to encode synthetic test image")
    synthetic_path.write_bytes(encoded.tobytes())
    metadata = {
        "kind": "synthetic",
        "file": "input/synthetic_test_image.png",
        "note": "実写真が無い場合のフォールバックとして自動生成した合成テスト画像",
    }
    return encoded.tobytes(), metadata


def generate_samples(
    output_dir: Path,
    input_path: Path | None,
    colors: list[StampColor],
    frames: list[StampFrame],
    base_subdir: str,
    with_variants: bool,
    author: str | None,
    source_url: str | None,
    license_name: str | None,
) -> dict:
    image_bytes, input_metadata = load_input_image_bytes(input_path, output_dir)
    if author:
        input_metadata["author"] = author
    if source_url:
        input_metadata["source_url"] = source_url
    if license_name:
        input_metadata["license"] = license_name

    base_dir = output_dir / "output" / base_subdir
    base_dir.mkdir(parents=True, exist_ok=True)

    source_entry: dict = {"input": input_metadata, "base": []}

    for color in colors:
        for frame in frames:
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
            source_entry["base"].append(
                {"file": f"output/{base_subdir}/{file_name}", **params}
            )

    if with_variants:
        variants_dir = output_dir / "output" / "variants"
        variants_dir.mkdir(parents=True, exist_ok=True)
        source_entry["variants"] = []
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
            source_entry["variants"].append(
                {"file": f"output/variants/{file_name}", **params}
            )

    return source_entry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--input",
        type=Path,
        default=None,
        help="入力画像のパス。指定しない場合は合成テスト画像を生成して使う。",
    )
    parser.add_argument(
        "--source-key",
        type=str,
        default=None,
        help="manifest.json の sources キー。省略時は入力ファイル名（拡張子なし）、"
        "入力未指定なら 'synthetic'。",
    )
    parser.add_argument("--author", type=str, default=None, help="入力画像の著作者（manifest に記録）")
    parser.add_argument("--source-url", type=str, default=None, help="入力画像の出典URL（manifest に記録）")
    parser.add_argument("--license", dest="license_name", type=str, default=None, help="入力画像のライセンス（manifest に記録）")
    parser.add_argument(
        "--colors",
        type=str,
        default=",".join(ALL_COLORS),
        help=f"カンマ区切りの色リスト（デフォルト: 全4色 = {','.join(ALL_COLORS)}）",
    )
    parser.add_argument(
        "--frames",
        type=str,
        default=",".join(ALL_FRAMES),
        help=f"カンマ区切りのフレームリスト（デフォルト: 全4種 = {','.join(ALL_FRAMES)}）",
    )
    parser.add_argument(
        "--output-subdir",
        type=str,
        default="base",
        help="output/ 配下のサブディレクトリ名（デフォルト: base）。副サンプルは別名を指定する。",
    )
    parser.add_argument(
        "--with-variants",
        action="store_true",
        help="掠れ・回転の参考パターン4通りも output/variants/ に生成する。",
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

    colors = [ALL_COLORS[name] for name in args.colors.split(",") if name]
    frames = [ALL_FRAMES[name] for name in args.frames.split(",") if name]

    if args.source_key:
        source_key = args.source_key
    elif args.input is not None:
        source_key = args.input.stem
    else:
        source_key = "synthetic"

    source_entry = generate_samples(
        output_dir=output_dir,
        input_path=args.input,
        colors=colors,
        frames=frames,
        base_subdir=args.output_subdir,
        with_variants=args.with_variants,
        author=args.author,
        source_url=args.source_url,
        license_name=args.license_name,
    )

    manifest_path = output_dir / "manifest.json"
    manifest: dict = {}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
    manifest["generated_at"] = datetime.now(timezone.utc).isoformat()
    manifest["cv2_version"] = cv2.__version__
    manifest.setdefault("sources", {})
    manifest["sources"][source_key] = source_entry
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    total_files = len(source_entry["base"]) + len(source_entry.get("variants", []))
    print(f"Wrote {total_files} PNG files for source '{source_key}' to {output_dir}")


if __name__ == "__main__":
    main()
