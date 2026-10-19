"""Real PyTorch inference (MobileNetV3-small) + OpenCV severity heuristic.
No fake predictions: with no trained checkpoint, predict() raises and the API answers 503."""
import os, numpy as np, cv2, torch, torch.nn as nn
from torchvision import models, transforms
CKPT = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "crop_model.pt"))
_tf = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor(),
                          transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
_m, classes = None, []

def load():
    global _m, classes
    if not os.path.exists(CKPT): return False
    ck = torch.load(CKPT, map_location="cpu")
    m = models.mobilenet_v3_small()
    m.classifier[3] = nn.Linear(m.classifier[3].in_features, len(ck["classes"]))
    m.load_state_dict(ck["state_dict"]); m.eval()
    _m, classes = m, ck["classes"]
    return True

def loaded(): return _m is not None

def predict(img):
    if _m is None: raise RuntimeError("model not loaded")
    with torch.no_grad(): p = torch.softmax(_m(_tf(img).unsqueeze(0)), 1)[0]
    v, i = p.topk(min(3, len(classes)))
    return [{"label": classes[j], "confidence": round(float(s), 4)} for s, j in zip(v, i)]

def severity(img):
    """Share of non-green leaf pixels (HSV threshold). A heuristic, NOT a trained model."""
    bgr = cv2.resize(cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR), (256, 256))
    h, s, v = cv2.split(cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV))
    leaf = (s > 40) & (v > 40); green = leaf & (h >= 35) & (h <= 90); n = int(leaf.sum())
    if n < 500: return None
    pct = round(100 * (n - int(green.sum())) / n, 1)
    return {"percent": pct, "band": "minimal" if pct < 5 else "low" if pct < 20 else "moderate" if pct < 50 else "high",
            "method": "HSV colour-threshold heuristic (not ML)"}
