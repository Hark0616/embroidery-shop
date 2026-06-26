# Deformation Worker

RunPod Serverless worker for assisted embroidery mockup mesh deformation.

## Contract

Input arrives under `event.input` with:

- `imageUrl`
- `surfaceId`
- `gridSize`
- `corners.topLeft/topRight/bottomLeft/bottomRight` in container percent
- `garmentType`
- `view`
- `workerVersion`

Output:

```json
{
  "proposals": [
    {
      "id": "pecho-centro-balanced",
      "label": "Balanceada",
      "intensity": "balanced",
      "gridSize": 5,
      "meshPoints": [{ "x": 36.0, "y": 30.0 }],
      "confidence": 0.78,
      "warnings": [],
      "source": "runpod-depth-normal-v1",
      "workerVersion": "v1"
    }
  ]
}
```

The current implementation is intentionally deterministic and contract-safe. The GPU image is ready for adding Marigold/Depth Anything inference inside `estimate_surface_signal` without changing the web app.

## Local Smoke Test

Use RunPod's local worker tooling or call `handler` from a short Python script with a public image URL. The web app only needs the RunPod endpoint id and API key.

