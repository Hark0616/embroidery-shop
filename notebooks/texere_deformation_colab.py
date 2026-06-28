"""
Texere assisted deformation notebook script.

Colab quick start:
1. In Texere admin, create/select a mockup zone and click "Paquete Colab".
2. In Colab, enable GPU and run:
   !pip install -q pillow requests numpy opencv-python transformers accelerate safetensors
   USE_DEPTH_ANYTHING = True
   %run texere_deformation_colab.py
3. Upload the exported texere-colab-*.json package.
4. Download texere-deformation-result-*.json and import it back in Texere admin.
"""

from __future__ import annotations

import io
import json
import math
import os
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import requests
from PIL import Image


USE_DEPTH_ANYTHING = globals().get("USE_DEPTH_ANYTHING", False)
DEPTH_MODEL = globals().get("DEPTH_MODEL", "depth-anything/Depth-Anything-V2-Small-hf")

Point = Dict[str, float]


def process_package(package: Dict[str, Any]) -> Dict[str, Any]:
    image_url = package["mockup"]["imageUrl"]
    surface = package["surface"]
    corners = package["corners"]
    grid_size = int(package["recommendedOutput"].get("gridSize") or surface.get("gridSize") or 5)
    coordinate_space = package.get("coordinateSpace") or {}

    if grid_size not in (3, 5, 7):
        grid_size = 5

    image = download_image(image_url)
    crop = crop_surface(image, corners, coordinate_space)
    depth_map, depth_warnings = estimate_depth_map(crop)
    signal = estimate_surface_signal(crop, depth_map)
    signal["warnings"].extend(depth_warnings)

    proposals = []
    for intensity, label, multiplier in (
        ("subtle", "Sutil", 0.55),
        ("balanced", "Balanceada", 1.0),
        ("marked", "Marcada", 1.45),
    ):
        mesh_points = generate_deformed_mesh(corners, grid_size, signal, multiplier)
        proposals.append(
            {
                "id": f"{surface['id']}-{intensity}",
                "label": label,
                "intensity": intensity,
                "gridSize": grid_size,
                "meshPoints": mesh_points,
                "confidence": round(float(signal["confidence"]), 3),
                "warnings": signal["warnings"],
                "source": signal["source"],
                "workerVersion": "colab-depth-v1",
                "debugPreviewUrl": None,
            }
        )

    return {
        "kind": "texere-calibration-result",
        "version": 1,
        "sourcePackageId": package.get("exportId"),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "proposals": proposals,
    }


def download_image(url: str) -> Image.Image:
    response = requests.get(url, timeout=45)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content)).convert("RGB")


def crop_surface(image: Image.Image, corners: Dict[str, Point], coordinate_space: Dict[str, Any]) -> Image.Image:
    width, height = image.size
    pixel_corners = [
        container_percent_to_image_pixel(corners[name], width, height, coordinate_space)
        for name in ("topLeft", "topRight", "bottomLeft", "bottomRight")
    ]
    xs = [point["x"] for point in pixel_corners]
    ys = [point["y"] for point in pixel_corners]

    margin_x = max((max(xs) - min(xs)) * 0.08, 6)
    margin_y = max((max(ys) - min(ys)) * 0.08, 6)
    left = clamp(min(xs) - margin_x, 0, width - 1)
    right = clamp(max(xs) + margin_x, left + 1, width)
    top = clamp(min(ys) - margin_y, 0, height - 1)
    bottom = clamp(max(ys) + margin_y, top + 1, height)

    return image.crop((int(left), int(top), int(right), int(bottom)))


def estimate_depth_map(crop: Image.Image):
    if not USE_DEPTH_ANYTHING:
        return None, ["Depth model disabled; using shading/texture fallback"]

    try:
        import torch
        from transformers import pipeline

        device = 0 if torch.cuda.is_available() else -1
        estimator = pipeline("depth-estimation", model=DEPTH_MODEL, device=device)
        output = estimator(crop)
        depth_image = output["depth"].resize(crop.size)
        depth = np.asarray(depth_image.convert("L"), dtype=np.float32) / 255.0
        return normalize_array(depth), []
    except Exception as exc:
        return None, [f"Depth model unavailable; fallback used: {exc}"]


def estimate_surface_signal(crop: Image.Image, depth_map: Optional[np.ndarray]) -> Dict[str, Any]:
    gray = np.asarray(crop.convert("L"), dtype=np.float32) / 255.0
    if gray.size == 0:
        return default_signal(["Empty crop; using neutral deformation"])

    base = depth_map if depth_map is not None else normalize_array(1.0 - gray)
    base = smooth_array(base)
    gy, gx = np.gradient(base)
    texture = float(np.clip(np.std(gray) * 2.2 + np.std(base) * 1.4, 0.0, 1.0))

    profile_x = normalize_profile(np.mean(base, axis=0))
    profile_y = normalize_profile(np.mean(base, axis=1))
    horizontal_energy = float(np.mean(np.abs(gx)))
    vertical_energy = float(np.mean(np.abs(gy)))
    total_energy = max(horizontal_energy + vertical_energy, 1e-6)

    confidence = 0.58 + min(texture, 0.8) * 0.34
    if depth_map is not None:
        confidence = min(0.95, confidence + 0.08)

    warnings: List[str] = []
    if texture < 0.08:
        warnings.append("Low texture/depth signal; review manually")

    return {
        "texture": texture,
        "horizontalCurve": 0.7 + (horizontal_energy / total_energy) * 0.55,
        "verticalDrape": 0.65 + (vertical_energy / total_energy) * 0.55,
        "profileX": profile_x.tolist(),
        "profileY": profile_y.tolist(),
        "confidence": confidence,
        "warnings": warnings,
        "source": "colab-depth-v1" if depth_map is not None else "colab-shading-v1",
    }


def generate_deformed_mesh(
    corners: Dict[str, Point],
    grid_size: int,
    signal: Dict[str, Any],
    intensity: float,
) -> List[Point]:
    tl = corners["topLeft"]
    tr = corners["topRight"]
    bl = corners["bottomLeft"]
    br = corners["bottomRight"]

    base_width = (distance(tl, tr) + distance(bl, br)) / 2
    base_height = (distance(tl, bl) + distance(tr, br)) / 2
    scale = max(min(base_width, base_height), 1.0)
    texture = signal["texture"]

    curve_x = scale * (0.012 + texture * 0.035) * signal["horizontalCurve"] * intensity
    curve_y = scale * (0.012 + texture * 0.038) * signal["verticalDrape"] * intensity
    profile_x = signal.get("profileX") or [0.0]
    profile_y = signal.get("profileY") or [0.0]

    points: List[Point] = []
    for row in range(grid_size):
        v = row / (grid_size - 1)
        left = lerp_point(tl, bl, v)
        right = lerp_point(tr, br, v)

        for col in range(grid_size):
            u = col / (grid_size - 1)
            point = lerp_point(left, right, u)
            is_corner = (row in (0, grid_size - 1)) and (col in (0, grid_size - 1))

            if not is_corner:
                bell = math.sin(math.pi * u) * math.sin(math.pi * v)
                profile_push_x = sample_profile(profile_x, u)
                profile_push_y = sample_profile(profile_y, v)
                point = {
                    "x": point["x"]
                    + (u - 0.5) * curve_x * bell
                    + profile_push_x * scale * 0.035 * bell * intensity,
                    "y": point["y"]
                    + curve_y * bell * (0.45 + (v - 0.5) * 0.7)
                    + profile_push_y * scale * 0.04 * bell * intensity,
                }

            points.append(round_point(point))

    return points


def container_percent_to_image_pixel(
    point: Point,
    image_width: int,
    image_height: int,
    coordinate_space: Dict[str, Any],
) -> Point:
    aspect_ratio = float(coordinate_space.get("aspectRatio") or 0.8)
    container_height = 1000.0
    container_width = container_height * aspect_ratio
    rect = object_contain_rect(container_width, container_height, image_width, image_height)
    container_x = point["x"] / 100 * container_width
    container_y = point["y"] / 100 * container_height

    return {
        "x": ((container_x - rect["x"]) / rect["width"]) * image_width,
        "y": ((container_y - rect["y"]) / rect["height"]) * image_height,
    }


def object_contain_rect(container_width: float, container_height: float, image_width: int, image_height: int) -> Dict[str, float]:
    container_ratio = container_width / container_height
    image_ratio = image_width / image_height
    if image_ratio > container_ratio:
        width = container_width
        height = width / image_ratio
        return {"x": 0.0, "y": (container_height - height) / 2, "width": width, "height": height}

    height = container_height
    width = height * image_ratio
    return {"x": (container_width - width) / 2, "y": 0.0, "width": width, "height": height}


def smooth_array(value: np.ndarray) -> np.ndarray:
    try:
        import cv2

        return cv2.GaussianBlur(value.astype(np.float32), (0, 0), 2.0)
    except Exception:
        return value


def normalize_array(value: np.ndarray) -> np.ndarray:
    value = value.astype(np.float32)
    low = float(np.nanmin(value))
    high = float(np.nanmax(value))
    if high - low < 1e-6:
        return np.zeros_like(value)
    return (value - low) / (high - low)


def normalize_profile(profile: np.ndarray) -> np.ndarray:
    centered = profile.astype(np.float32) - float(np.mean(profile))
    max_abs = float(np.max(np.abs(centered)))
    if max_abs < 1e-6:
        return centered
    return centered / max_abs


def sample_profile(profile: Iterable[float], t: float) -> float:
    values = list(profile)
    if not values:
        return 0.0
    if len(values) == 1:
        return float(values[0])

    position = clamp(t, 0, 1) * (len(values) - 1)
    left = int(math.floor(position))
    right = min(left + 1, len(values) - 1)
    mix = position - left
    return float(values[left] * (1 - mix) + values[right] * mix)


def default_signal(warnings: List[str]) -> Dict[str, Any]:
    return {
        "texture": 0.25,
        "horizontalCurve": 1.0,
        "verticalDrape": 1.0,
        "profileX": [0.0],
        "profileY": [0.0],
        "confidence": 0.5,
        "warnings": warnings,
        "source": "colab-neutral-v1",
    }


def lerp_point(a: Point, b: Point, t: float) -> Point:
    return {"x": a["x"] + (b["x"] - a["x"]) * t, "y": a["y"] + (b["y"] - a["y"]) * t}


def distance(a: Point, b: Point) -> float:
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def round_point(point: Point) -> Point:
    return {"x": round(float(clamp(point["x"], 0, 100)), 1), "y": round(float(clamp(point["y"], 0, 100)), 1)}


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def load_package_interactive() -> Dict[str, Any]:
    try:
        from google.colab import files

        uploaded = files.upload()
        if not uploaded:
            raise RuntimeError("No file uploaded")
        name = next(iter(uploaded.keys()))
        return json.loads(uploaded[name].decode("utf-8"))
    except ImportError:
        path = os.environ.get("TEXERE_PACKAGE_PATH", "texere-colab-package.json")
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)


def save_result_interactive(result: Dict[str, Any]) -> str:
    source_id = str(result.get("sourcePackageId") or "texere")
    safe_id = "".join(ch if ch.isalnum() or ch in ("-", "_") else "-" for ch in source_id)[:80]
    output_path = f"texere-deformation-result-{safe_id}.json"
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2)

    try:
        from google.colab import files

        files.download(output_path)
    except ImportError:
        pass

    return output_path


def main() -> None:
    package = load_package_interactive()
    result = process_package(package)
    output_path = save_result_interactive(result)
    print(f"Saved {output_path}")
    print("Import this JSON in Texere admin > Malla > JSON Avanzado > Importar resultado.")


if __name__ == "__main__":
    main()

