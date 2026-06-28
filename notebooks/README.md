# Texere Colab deformation flow

Use this when RunPod is not configured or you want to process a mockup with a temporary Colab GPU.

## Steps

1. In Texere admin, open a mockup and create/select a zone.
2. Adjust the 4 corners around the embroidery area.
3. Click `Paquete Colab`.
4. Open Google Colab and enable GPU.
5. Upload or paste `texere_deformation_colab.py`.
6. Run:

```python
!pip install -q pillow requests numpy opencv-python transformers accelerate safetensors
USE_DEPTH_ANYTHING = True
%run texere_deformation_colab.py
```

7. Upload the exported `texere-colab-*.json`.
8. Download `texere-deformation-result-*.json`.
9. In Texere admin, paste the result in `JSON Avanzado` and click `Importar resultado`.
10. Choose the best proposal, preview it, then save or publish.

If the depth model is unavailable, the script falls back to a shading/texture signal and still returns valid proposals.

