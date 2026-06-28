"""
Texere assisted deformation notebook script.

Colab quick start:
1. In Texere admin, create/select a mockup zone and click "Paquete Colab".
2. In Colab, enable GPU and run:
   !pip install -q pillow requests numpy opencv-python transformers accelerate safetensors
   USE_DEPTH_ANYTHING = True
   DEPTH_MODEL = "depth-anything/Depth-Anything-V2-Base-hf"
   OUTPUT_GRID_SIZE = 7
   DEFORMATION_STRENGTH = 0.75
   DEPTH_INFLUENCE = 0.28
   %run -i texere_deformation_colab.py
3. Upload the exported texere-colab-*.json package.
4. Download texere-deformation-result-*.json and import it back in Texere admin.
"""

from __future__ import annotations

import io
import json
import math
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import requests
from PIL import Image


Point = Dict[str, float]


def read_config_value(name: str, default: Any) -> Any:
    if name in globals():
        return globals()[name]
    return os.environ.get(name, default)


def read_bool_config(name: str, default: bool) -> bool:
    value = read_config_value(name, default)
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def read_float_config(name: str, default: float) -> float:
    value = read_config_value(name, default)
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def read_int_config(name: str, default: int) -> int:
    value = read_config_value(name, default)
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def is_running_in_colab() -> bool:
    return "google.colab" in sys.modules or os.path.exists("/content")


RUNNING_IN_COLAB = is_running_in_colab()
USE_DEPTH_ANYTHING = read_bool_config("USE_DEPTH_ANYTHING", RUNNING_IN_COLAB)
DEPTH_MODEL = str(read_config_value("DEPTH_MODEL", "depth-anything/Depth-Anything-V2-Base-hf"))
OUTPUT_GRID_SIZE = read_int_config("OUTPUT_GRID_SIZE", 7 if RUNNING_IN_COLAB else 0)
DEFORMATION_STRENGTH = read_float_config("DEFORMATION_STRENGTH", 0.75)
DEPTH_INFLUENCE = read_float_config("DEPTH_INFLUENCE", 0.28)
LOCK_BOUNDARY = read_bool_config("LOCK_BOUNDARY", True)
MAX_DISPLACEMENT_RATIO = read_float_config("MAX_DISPLACEMENT_RATIO", 0.075)


def process_package(package: Dict[str, Any]) -> Dict[str, Any]:
    image_url = package["mockup"]["imageUrl"]
    surface = package["surface"]
    corners = package["corners"]
    grid_size = int(OUTPUT_GRID_SIZE or package["recommendedOutput"].get("gridSize") or surface.get("gridSize") or 5)
    coordinate_space = package.get("coordinateSpace") or {}

    if grid_size not in (3, 5, 7):
        grid_size = 7

    image = download_image(image_url)
    surface_image = rectify_surface(image, corners, coordinate_space)
    depth_map, depth_warnings = estimate_depth_map(surface_image)
    signal = estimate_surface_signal(surface_image, depth_map)
    signal["warnings"].extend(depth_warnings)

    proposals = []
    for intensity, label, multiplier in (
        ("subtle", "Sutil", 0.55),
        ("balanced", "Balanceada", 0.9),
        ("marked", "Marcada", 1.25),
    ):
        mesh_points = generate_valid_deformed_mesh(corners, grid_size, signal, multiplier)
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
                "workerVersion": "colab-cloth-v3",
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


def get_surface_pixel_corners(
    image: Image.Image,
    corners: Dict[str, Point],
    coordinate_space: Dict[str, Any],
) -> List[Point]:
    width, height = image.size
    return [
        container_percent_to_image_pixel(corners[name], width, height, coordinate_space)
        for name in ("topLeft", "topRight", "bottomLeft", "bottomRight")
    ]


def rectify_surface(image: Image.Image, corners: Dict[str, Point], coordinate_space: Dict[str, Any]) -> Image.Image:
    try:
        import cv2

        top_left, top_right, bottom_left, bottom_right = get_surface_pixel_corners(image, corners, coordinate_space)
        output_width = int(
            clamp(
                (distance(top_left, top_right) + distance(bottom_left, bottom_right)) / 2,
                224,
                768,
            )
        )
        output_height = int(
            clamp(
                (distance(top_left, bottom_left) + distance(top_right, bottom_right)) / 2,
                224,
                768,
            )
        )

        src = np.float32(
            [
                [top_left["x"], top_left["y"]],
                [top_right["x"], top_right["y"]],
                [bottom_right["x"], bottom_right["y"]],
                [bottom_left["x"], bottom_left["y"]],
            ]
        )
        dst = np.float32(
            [
                [0, 0],
                [output_width - 1, 0],
                [output_width - 1, output_height - 1],
                [0, output_height - 1],
            ]
        )
        matrix = cv2.getPerspectiveTransform(src, dst)
        warped = cv2.warpPerspective(
            np.asarray(image),
            matrix,
            (output_width, output_height),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
        return Image.fromarray(warped)
    except Exception as exc:
        print(f"Perspective rectification unavailable; using bounding crop: {exc}")
        return crop_surface(image, corners, coordinate_space)


def crop_surface(image: Image.Image, corners: Dict[str, Point], coordinate_space: Dict[str, Any]) -> Image.Image:
    width, height = image.size
    pixel_corners = get_surface_pixel_corners(image, corners, coordinate_space)
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
        device_label = torch.cuda.get_device_name(0) if device == 0 else "CPU"
        print(f"Depth model enabled: {DEPTH_MODEL} on {device_label}")
        start = time.perf_counter()
        estimator = pipeline("depth-estimation", model=DEPTH_MODEL, device=device)
        output = estimator(crop)
        depth_image = output["depth"].resize(crop.size)
        depth = np.asarray(depth_image.convert("L"), dtype=np.float32) / 255.0
        print(f"Depth map ready in {time.perf_counter() - start:.1f}s")
        return normalize_array(depth), []
    except Exception as exc:
        return None, [f"Depth model unavailable; fallback used: {exc}"]


def estimate_surface_signal(crop: Image.Image, depth_map: Optional[np.ndarray]) -> Dict[str, Any]:
    gray = np.asarray(crop.convert("L"), dtype=np.float32) / 255.0
    if gray.size == 0:
        return default_signal(["Empty crop; using neutral deformation"])

    base = normalize_array(depth_map) if depth_map is not None else normalize_array(1.0 - gray)
    broad_shape = smooth_array(base, sigma=10.0)
    local_shape = smooth_array(base, sigma=2.0)
    detail_shape = normalize_signed(local_shape - broad_shape)
    height_map = normalize_signed(broad_shape)
    gy, gx = np.gradient(broad_shape)
    slope_x = normalize_signed(gx)
    slope_y = normalize_signed(gy)
    texture = float(np.clip(np.std(gray) * 2.0 + np.std(local_shape) * 1.8 + np.std(detail_shape) * 0.35, 0.0, 1.0))

    profile_x = normalize_profile(np.mean(broad_shape, axis=0))
    profile_y = normalize_profile(np.mean(broad_shape, axis=1))
    horizontal_energy = float(np.mean(np.abs(gx)))
    vertical_energy = float(np.mean(np.abs(gy)))
    total_energy = max(horizontal_energy + vertical_energy, 1e-6)

    confidence = 0.58 + min(texture, 0.8) * 0.34
    if depth_map is not None:
        confidence = min(0.95, confidence + 0.08)

    warnings: List[str] = []
    if texture < 0.08:
        warnings.append("Low texture/depth signal; review manually")
    warnings.append("Cloth-safe mode: boundary locked and displacement clamped")

    return {
        "texture": texture,
        "horizontalCurve": 0.7 + (horizontal_energy / total_energy) * 0.55,
        "verticalDrape": 0.65 + (vertical_energy / total_energy) * 0.55,
        "profileX": profile_x.tolist(),
        "profileY": profile_y.tolist(),
        "heightMap": height_map,
        "slopeX": slope_x,
        "slopeY": slope_y,
        "detailMap": detail_shape,
        "confidence": confidence,
        "warnings": warnings,
        "source": "colab-depth-cloth-v3" if depth_map is not None else "colab-shading-cloth-v3",
    }


def generate_valid_deformed_mesh(
    corners: Dict[str, Point],
    grid_size: int,
    signal: Dict[str, Any],
    intensity: float,
) -> List[Point]:
    current_intensity = intensity
    for _ in range(6):
        points = generate_deformed_mesh(corners, grid_size, signal, current_intensity)
        if is_valid_mesh(points, grid_size):
            return points
        current_intensity *= 0.78

    return generate_deformed_mesh(corners, grid_size, signal, 0.45)


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
    source = str(signal.get("source") or "")
    depth_boost = 1.0 if "depth" in source else 0.55

    curve_x = scale * (0.010 + texture * 0.020) * signal["horizontalCurve"] * intensity * DEFORMATION_STRENGTH
    curve_y = scale * (0.008 + texture * 0.018) * signal["verticalDrape"] * intensity * DEFORMATION_STRENGTH
    center_sag = scale * (0.006 + texture * 0.016) * intensity * DEFORMATION_STRENGTH
    slope_strength = scale * (0.012 + texture * 0.022) * intensity * DEFORMATION_STRENGTH * DEPTH_INFLUENCE * depth_boost
    wrinkle_strength = scale * (0.003 + texture * 0.008) * intensity * DEFORMATION_STRENGTH * DEPTH_INFLUENCE
    profile_strength = scale * 0.022 * intensity * DEFORMATION_STRENGTH
    height_strength = curve_y * DEPTH_INFLUENCE * 0.35 * depth_boost
    profile_x = signal.get("profileX") or [0.0]
    profile_y = signal.get("profileY") or [0.0]
    height_map = signal.get("heightMap")
    slope_x = signal.get("slopeX")
    slope_y = signal.get("slopeY")
    detail_map = signal.get("detailMap")

    points: List[Point] = []
    for row in range(grid_size):
        v = row / (grid_size - 1)
        left = lerp_point(tl, bl, v)
        right = lerp_point(tr, br, v)

        for col in range(grid_size):
            u = col / (grid_size - 1)
            base_point = lerp_point(left, right, u)
            point = base_point
            is_boundary = row in (0, grid_size - 1) or col in (0, grid_size - 1)

            if not (LOCK_BOUNDARY and is_boundary):
                bell = math.sin(math.pi * u) * math.sin(math.pi * v)
                row_bell = math.sin(math.pi * v)
                col_bell = math.sin(math.pi * u)
                profile_push_x = sample_profile(profile_x, u)
                profile_push_y = sample_profile(profile_y, v)
                height_push = sample_map(height_map, u, v)
                slope_push_x = sample_map(slope_x, u, v)
                slope_push_y = sample_map(slope_y, u, v)
                detail_push = sample_map(detail_map, u, v)
                point = {
                    "x": point["x"]
                    + (u - 0.5) * curve_x * row_bell * (0.45 + col_bell * 0.55)
                    + slope_push_x * slope_strength * bell
                    + profile_push_x * profile_strength * bell,
                    "y": point["y"]
                    + center_sag * bell
                    + curve_y * col_bell * (v - 0.5) * 0.75
                    - height_push * height_strength * bell
                    + slope_push_y * slope_strength * 0.65 * bell
                    + detail_push * wrinkle_strength * bell
                    + profile_push_y * profile_strength * bell,
                }
                point = limit_displacement(base_point, point, scale, intensity)

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


def smooth_array(value: np.ndarray, sigma: float = 2.0) -> np.ndarray:
    try:
        import cv2

        return cv2.GaussianBlur(value.astype(np.float32), (0, 0), sigma)
    except Exception:
        return value


def normalize_array(value: np.ndarray) -> np.ndarray:
    value = value.astype(np.float32)
    low = float(np.nanmin(value))
    high = float(np.nanmax(value))
    if high - low < 1e-6:
        return np.zeros_like(value)
    return (value - low) / (high - low)


def normalize_signed(value: np.ndarray) -> np.ndarray:
    centered = value.astype(np.float32) - float(np.nanmean(value))
    scale = float(np.nanpercentile(np.abs(centered), 95))
    if scale < 1e-6:
        return np.zeros_like(centered)
    return np.clip(centered / scale, -1.0, 1.0)


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


def sample_map(value: Any, u: float, v: float) -> float:
    if not isinstance(value, np.ndarray) or value.size == 0:
        return 0.0

    height, width = value.shape[:2]
    x = clamp(u, 0, 1) * (width - 1)
    y = clamp(v, 0, 1) * (height - 1)
    x0 = int(math.floor(x))
    y0 = int(math.floor(y))
    x1 = min(x0 + 1, width - 1)
    y1 = min(y0 + 1, height - 1)
    mx = x - x0
    my = y - y0

    top = float(value[y0, x0]) * (1 - mx) + float(value[y0, x1]) * mx
    bottom = float(value[y1, x0]) * (1 - mx) + float(value[y1, x1]) * mx
    return float(top * (1 - my) + bottom * my)


def default_signal(warnings: List[str]) -> Dict[str, Any]:
    return {
        "texture": 0.25,
        "horizontalCurve": 1.0,
        "verticalDrape": 1.0,
        "profileX": [0.0],
        "profileY": [0.0],
        "heightMap": None,
        "slopeX": None,
        "slopeY": None,
        "detailMap": None,
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


def limit_displacement(base_point: Point, point: Point, scale: float, intensity: float) -> Point:
    dx = point["x"] - base_point["x"]
    dy = point["y"] - base_point["y"]
    length = math.hypot(dx, dy)
    max_shift = min(scale * MAX_DISPLACEMENT_RATIO * min(1.2, max(0.45, intensity * DEFORMATION_STRENGTH)), 3.0)

    if length <= max_shift or length < 1e-6:
        return point

    ratio = max_shift / length
    return {
        "x": base_point["x"] + dx * ratio,
        "y": base_point["y"] + dy * ratio,
    }


def is_valid_mesh(points: List[Point], grid_size: int) -> bool:
    if len(points) != grid_size * grid_size:
        return False

    for point in points:
        if not math.isfinite(point["x"]) or not math.isfinite(point["y"]):
            return False
        if point["x"] < 0 or point["x"] > 100 or point["y"] < 0 or point["y"] > 100:
            return False

    for row in range(grid_size - 1):
        for col in range(grid_size - 1):
            top_left = points[row * grid_size + col]
            top_right = points[row * grid_size + col + 1]
            bottom_left = points[(row + 1) * grid_size + col]
            bottom_right = points[(row + 1) * grid_size + col + 1]
            if segments_intersect(top_left, top_right, bottom_right, bottom_left):
                return False
            if segments_intersect(top_right, bottom_right, bottom_left, top_left):
                return False
            if abs(polygon_area([top_left, top_right, bottom_right, bottom_left])) < 0.02:
                return False

    return True


def polygon_area(points: List[Point]) -> float:
    total = 0.0
    for index, point in enumerate(points):
        next_point = points[(index + 1) % len(points)]
        total += point["x"] * next_point["y"] - next_point["x"] * point["y"]
    return total / 2


def segments_intersect(a: Point, b: Point, c: Point, d: Point) -> bool:
    o1 = orientation(a, b, c)
    o2 = orientation(a, b, d)
    o3 = orientation(c, d, a)
    o4 = orientation(c, d, b)
    return o1 * o2 < 0 and o3 * o4 < 0


def orientation(a: Point, b: Point, c: Point) -> float:
    return (b["x"] - a["x"]) * (c["y"] - a["y"]) - (b["y"] - a["y"]) * (c["x"] - a["x"])


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


def print_runtime_config() -> None:
    print("Texere deformation config")
    print(f"- Depth Anything: {'enabled' if USE_DEPTH_ANYTHING else 'disabled'}")
    print(f"- Depth model: {DEPTH_MODEL}")
    print(f"- Output grid: {OUTPUT_GRID_SIZE or 'package default'}")
    print(f"- Deformation strength: {DEFORMATION_STRENGTH}")
    print(f"- Depth influence: {DEPTH_INFLUENCE}")
    print(f"- Boundary lock: {'enabled' if LOCK_BOUNDARY else 'disabled'}")
    print(f"- Max displacement ratio: {MAX_DISPLACEMENT_RATIO}")
    if RUNNING_IN_COLAB and not USE_DEPTH_ANYTHING:
        print("WARNING: Colab is running without depth. Results will be a fast shading fallback.")


def main() -> None:
    print_runtime_config()
    package = load_package_interactive()
    result = process_package(package)
    output_path = save_result_interactive(result)
    print(f"Saved {output_path}")
    print("Import this JSON in Texere admin > Malla > JSON Avanzado > Importar resultado.")


if __name__ == "__main__":
    main()
