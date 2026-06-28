import io
import math
import os
from typing import Any, Dict, List, Tuple

import numpy as np
import requests
from PIL import Image


Point = Dict[str, float]


def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    payload = event.get("input") or {}
    image_url = required(payload, "imageUrl")
    surface_id = required(payload, "surfaceId")
    grid_size = int(payload.get("gridSize") or 5)
    corners = required(payload, "corners")
    coordinate_space = payload.get("coordinateSpace") or {}
    worker_version = str(payload.get("workerVersion") or os.getenv("DEFORMATION_WORKER_VERSION") or "runpod-depth-normal-v1")

    if grid_size not in (3, 5, 7):
        raise ValueError("gridSize must be 3, 5, or 7")

    image = download_image(image_url)
    crop = crop_surface(image, corners, coordinate_space)
    signal = estimate_surface_signal(crop)

    proposals = []
    for intensity, label, multiplier in (
        ("subtle", "Sutil", 0.55),
        ("balanced", "Balanceada", 1.0),
        ("marked", "Marcada", 1.55),
    ):
        mesh_points = generate_deformed_mesh(corners, grid_size, signal, multiplier)
        proposals.append(
            {
                "id": f"{surface_id}-{intensity}",
                "label": label,
                "intensity": intensity,
                "gridSize": grid_size,
                "meshPoints": mesh_points,
                "confidence": round(float(signal["confidence"]), 3),
                "warnings": signal["warnings"],
                "source": "runpod-depth-normal-v1",
                "workerVersion": worker_version,
                "debugPreviewUrl": None,
            }
        )

    return {"proposals": proposals}


def required(payload: Dict[str, Any], key: str) -> Any:
    value = payload.get(key)
    if value is None:
        raise ValueError(f"{key} is required")
    return value


def download_image(url: str) -> Image.Image:
    response = requests.get(url, timeout=30)
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

    left = clamp(min(xs), 0, width - 1)
    right = clamp(max(xs), left + 1, width)
    top = clamp(min(ys), 0, height - 1)
    bottom = clamp(max(ys), top + 1, height)

    return image.crop((int(left), int(top), int(right), int(bottom)))


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


def object_contain_rect(
    container_width: float,
    container_height: float,
    image_width: int,
    image_height: int,
) -> Dict[str, float]:
    container_ratio = container_width / container_height
    image_ratio = image_width / image_height

    if image_ratio > container_ratio:
        width = container_width
        height = width / image_ratio
        return {
            "x": 0.0,
            "y": (container_height - height) / 2,
            "width": width,
            "height": height,
        }

    height = container_height
    width = height * image_ratio
    return {
        "x": (container_width - width) / 2,
        "y": 0.0,
        "width": width,
        "height": height,
    }


def estimate_surface_signal(crop: Image.Image) -> Dict[str, Any]:
    gray = np.asarray(crop.convert("L"), dtype=np.float32) / 255.0
    if gray.size == 0:
        return default_signal(["Empty crop; using neutral deformation"])

    gy, gx = np.gradient(gray)
    texture = float(np.clip(np.std(gray) * 2.5, 0.0, 1.0))
    horizontal_energy = float(np.mean(np.abs(gx)))
    vertical_energy = float(np.mean(np.abs(gy)))
    total_energy = max(horizontal_energy + vertical_energy, 1e-6)

    horizontal_curve = 0.75 + (horizontal_energy / total_energy) * 0.5
    vertical_drape = 0.65 + (vertical_energy / total_energy) * 0.5

    confidence = 0.55 + min(texture, 0.7) * 0.35
    warnings: List[str] = []
    if texture < 0.08:
        warnings.append("La zona tiene poca textura; revisa la propuesta manualmente")

    return {
        "texture": texture,
        "horizontalCurve": horizontal_curve,
        "verticalDrape": vertical_drape,
        "confidence": confidence,
        "warnings": warnings,
    }


def default_signal(warnings: List[str]) -> Dict[str, Any]:
    return {
        "texture": 0.25,
        "horizontalCurve": 1.0,
        "verticalDrape": 1.0,
        "confidence": 0.5,
        "warnings": warnings,
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
    curve_x = scale * (0.015 + texture * 0.04) * signal["horizontalCurve"] * intensity
    curve_y = scale * (0.012 + texture * 0.035) * signal["verticalDrape"] * intensity
    center_bulge = scale * (0.01 + texture * 0.025) * intensity

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
                x_from_center = u - 0.5
                y_from_center = v - 0.5

                point = {
                    "x": point["x"] + x_from_center * curve_x * bell + x_from_center * center_bulge * bell,
                    "y": point["y"] + curve_y * bell * (0.6 + y_from_center),
                }

            points.append(round_point(point))

    return points


def lerp_point(a: Point, b: Point, t: float) -> Point:
    return {
        "x": a["x"] + (b["x"] - a["x"]) * t,
        "y": a["y"] + (b["y"] - a["y"]) * t,
    }


def distance(a: Point, b: Point) -> float:
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def round_point(point: Point) -> Point:
    return {
        "x": round(float(clamp(point["x"], 0, 100)), 1),
        "y": round(float(clamp(point["y"], 0, 100)), 1),
    }


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


if __name__ == "__main__":
    import runpod

    runpod.serverless.start({"handler": handler})
